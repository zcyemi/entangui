import { UIDrawCmdType, UIActionType, UIActionData, UIFrameData, UIEventListener, UIEventData, UIDrawCmd, UITheme } from "./UIProtocol";


function MergeArray(tar:string[],src:string[]){
    if(src == null || src.length == 0) return tar;
    if(tar == null){
        tar = [];
    }

    src.forEach(item=>{
        if(!item) return;
        if(!tar.includes(item)){
            tar.push(item);
        }
    });
    return tar;
}


function MergeObject(tar: any, src: any) {
    if (src == null) return tar;
    if(tar == null){
        tar = {};
    }
    return Object.assign(tar, src);
}

export class UIDrawCmdBuilder{
    public cmd:UIDrawCmd;
    public constructor(cmd:UIDrawCmd){
        this.cmd = cmd;
    }

    public classes(... classdef:string[]){
        const cmd = this.cmd;
        cmd.parameters['class'] = MergeArray(cmd.parameters['class'],classdef);

        console.log(cmd.parameters);
        return this;
    }

    public theme(theme:UITheme){
        const cmd = this.cmd;
        cmd.parameters['theme'] = UITheme[theme];
        return this;
    }

    public style(style:any){
        const cmd = this.cmd;
        cmd.parameters['style'] = MergeObject(cmd.parameters['style'],style);
        return this;
    }

    public property(key:string,val:any){
        const cmd = this.cmd;
        cmd.parameters[key] = val;
        return this;
    }
}



export class UIContext{
    private m_data:UIFrameData;
    private m_eventRegister:Map<String,Map<String,Function>> = new Map();
    private m_idbuilder = {};
    private m_actionIds:Map<UIActionType,number> = new Map();

    public actions:UIActionData[] = [];

    public constructor(){
        for (const key in UIActionType) {
            if (UIActionType.hasOwnProperty(key)) {
                const element = UIActionType[key];
                if(typeof element === 'string'){
                    this.m_actionIds.set(<UIActionType>UIActionType[element],0);
                }
            }
        }
    }

    public dispatchEvent(evt:UIEventData):boolean{
        let registry = this.m_eventRegister;
        let idmap = registry.get(evt.id);
        if(idmap == null) return false;

        var evtname = evt.evt;
        var action:Function = idmap.get(evtname);
        if(action !=null){
            action(evt.data);
            if(evtname == 'result'){
                registry.delete(evt.id);
            }
            return true;
        }
        return false;
    }

    public pushCmd(type:UIDrawCmdType,parameter?:any):UIDrawCmdBuilder{
        var cmd=  new UIDrawCmd();
        cmd.cmd = type;
        if(parameter!=null){
            parameter.class = parameter.class || [];
        }
        cmd.parameters =parameter;

        this.m_data.draw_commands.push(
            cmd
        )
        return new UIDrawCmdBuilder(cmd);
    }

    public pushAction(data:UIActionData){
        this.actions.push(data);
    }


    public pushEventListener(id:string,event:string,action:Function){
        if(action==null) return;
        var listener = new UIEventListener();
        listener.id = id;
        listener.type = event;

        let registry = this.m_eventRegister;
        var idmap = registry.get(id);
        if(idmap == null){
            idmap = new Map();
            registry.set(id,idmap);
        }
        idmap.set(event,action);
    }


    public getActionId(type:UIActionType):string{
        let index = this.m_actionIds.get(type);
        this.m_actionIds.set(type,index+1);
        return `${UIActionType[type]}_${index}`;
    }

    public genItemID(type:UIDrawCmdType):string{
        let builder= this.m_idbuilder;
        var tname = UIDrawCmdType[type];
        let lastid =builder[tname];
        if(lastid == undefined){
            builder[tname] = 0;
            lastid = 0;
        }
        else{
            lastid ++;
            builder[tname] = lastid;
        }
        return `${tname}-${lastid}`;
    }

    public beginFrame(){
        this.m_data =new UIFrameData();
        this.m_idbuilder = {};
        return this;
    }
    public endFrame():UIFrameData{
        return this.m_data;
    }

    public actionToast(title:string,msg:string):string{
        let id  =this.getActionId(UIActionType.Toast);
        var data = new UIActionData(id,UIActionType.Toast,{title:title,msg:msg});
        this.pushAction(data);
        return id;
    }

    public actionQuery(title:string,msg:string,result?:(confirm:boolean)=>void,text_confirm?:string,text_cancel?:string){
        let id = this.getActionId(UIActionType.Query);
        var data= new UIActionData(id,UIActionType.Query,{
            title:title,
            msg:msg,
            text_confirm: text_confirm,
            text_cancel:text_cancel,
            result:result!=null
        });

        if(result){
            this.pushEventListener(id,'result',result);
        }

        this.pushAction(data);
        return id;
    }

    public button(text:string,click?:Function,theme:string ='primary'):UIDrawCmdBuilder{
        let id = this.genItemID(UIDrawCmdType.Button);
        if(click !=null){
            this.pushEventListener(id,'click',click);
        }
        return this.pushCmd(UIDrawCmdType.Button,{
            text:text,
            click:click!=null,
            id:id,
            class:[`btn-${theme}`]
        }).style({})
    }

    public text(text:string,tag:string='p'):UIDrawCmdBuilder{
        return this.pushCmd(UIDrawCmdType.Text,{
            text:text,
            tag:tag
        });
    }

    public bandage(text:string):UIDrawCmdBuilder{
        return this.pushCmd(UIDrawCmdType.Bandage,{text:text});
    }

    public alert(text:string):UIDrawCmdBuilder{
        return this.pushCmd(UIDrawCmdType.Alert,{
            text:text
        });
    }

    public input(label:string,text:string,finish?:(val:string)=>void):UIDrawCmdBuilder{
        let id = this.genItemID(UIDrawCmdType.Input);
        this.pushEventListener(id,'finish',finish);
        return this.pushCmd(UIDrawCmdType.Input,{
            'text':text,
            'label':label,
            'id':id,
            'finish':finish!=null
        });
    }

    public inputComplex(label:string,text:string,btn:string,finish?:(val:string)=>void,click?:()=>void):UIDrawCmdBuilder{
        let id = this.genItemID(UIDrawCmdType.Input);
        this.pushEventListener(id,'finish',finish);

        let btnid = `${id}-btn`;

        if(click){
            this.pushEventListener(btnid,'click',click);
        }

        return this.pushCmd(UIDrawCmdType.Input,{
            'text':text,
            'label':label,
            'id':id,
            'finish':finish!=null,
            'btn':btn,
            'click': click!=null
        });
    }

    public divider(){
        return this.pushCmd(UIDrawCmdType.Divider);
    }

    public beginGroup(padidng:string = '3px',classes?:string[]){
        return this.pushCmd(UIDrawCmdType.BeginGroup,{
            padding:padidng,
            classes:classes
        });
    }

    public endGroup(){
        return this.pushCmd(UIDrawCmdType.EndGroup);
    }

    public sidebarBegin(id:string,text:string,click?:Function){
        if(click !=null){
            this.pushEventListener(id,'click',click);
        }
        return this.pushCmd(UIDrawCmdType.SidebarBegin,{
            text:text,
            id:id,
            click:click!=null
        });
    }


    public sidebarEnd(){
        return this.pushCmd(UIDrawCmdType.SidebarEnd);
    }
    public sidebarItem(key:string,text:string){
        return this.pushCmd(UIDrawCmdType.SidebarItem,{
            text:text,
            key:key
        });
    }

    public flexBegin(){
        return this.pushCmd(UIDrawCmdType.FlexBegin);
    }
    public flexEnd(){
        return this.pushCmd(UIDrawCmdType.FlexEnd);
    }

    public FlexItemBegin(width?:string,flex?:number){
        return this.pushCmd(UIDrawCmdType.FlexItemBegin,{
            width:width,
            flex:flex
        });
    }

    public flexItemEnd(){
        return this.pushCmd(UIDrawCmdType.FlexItemEnd)
    }


    public cardBegin(title:string){
        return this.pushCmd(UIDrawCmdType.CardBegin,{'title':title});
    }

    public cardEnd(){
        return this.pushCmd(UIDrawCmdType.CardEnd);
    }

    public listBegin(flush:boolean){
        return this.pushCmd(UIDrawCmdType.ListBegin,{'flush':flush});
    }

    public listItemNext(){
        return this.pushCmd(UIDrawCmdType.ListItemNext);
    }
    public listEnd(){
        return this.pushCmd(UIDrawCmdType.ListEnd);
    }

    public tabBegin(tabs:string[],click?:(index:number)=>void){
        let id = this.genItemID(UIDrawCmdType.TabBegin);

        this.pushEventListener(id,'click',click);
        return this.pushCmd(UIDrawCmdType.TabBegin,{
            id:id,
            tabs:tabs,
        });
    }

    public tabEnd(){
        this.pushCmd(UIDrawCmdType.TabEnd);
    }


    public collapseBegin(title:string){
        let id = this.genItemID(UIDrawCmdType.CardBegin);
        return this.pushCmd(UIDrawCmdType.CollapseBegin,{title:title,id:id});
    }

    public collapseEnd(){
        return this.pushCmd(UIDrawCmdType.CollapseEnd);
    }

    public formBegin(){
        return this.pushCmd(UIDrawCmdType.FormBegin);
    }

    public formEnd(){
        return this.pushCmd(UIDrawCmdType.FormEnd);
    }

    public formInput(label:string,text:string,type:"email"|"password"|"text"|"number",finish?:(val:string)=>void){
        let id = this.genItemID(UIDrawCmdType.FormInput);

        this.pushEventListener(id,'finish',finish);
        return this.pushCmd(UIDrawCmdType.FormInput,{
            label:label,
            text:text,
            type:type,
            id:id,
            finish:finish!=null
        });
    }

    public formTextArea(label:string,text:string,rows:number =3,finish?:(val:string)=>void){
        let id = this.genItemID(UIDrawCmdType.FormTextArea);
        this.pushEventListener(id,"finish",finish);
        return this.pushCmd(UIDrawCmdType.FormTextArea,{
            label:label,
            text:text,
            rows:rows,
            id:id,
            finish:finish!=null
        });
    }

    public formSelect(label:string,items:{[key:string]:string},change?:(key:string)=>void){
        let id = this.genItemID(UIDrawCmdType.FormSelect);

        this.pushEventListener(id,'change',change);

        return this.pushCmd(UIDrawCmdType.FormSelect,{
            label:label,
            items:items,
            id:id,
            change:change!=null
        });
    }

}