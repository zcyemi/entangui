import { UIDrawCmdType, UIActionType, UIActionData, UIFrameData, UIEventListener, UIEventData, UIDrawCmd, UITheme, UIDefineData, UIDefineType, UIEvalData } from "./UIProtocol";
import { UISource } from "./UISource";


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
    private ctx:UIContext;
    public constructor(cmd:UIDrawCmd,ctx:UIContext){
        this.cmd = cmd;
        this.ctx = ctx;
    }

    public classes(... classdef:string[]){
        const cmd = this.cmd;
        cmd.parameters['class'] = MergeArray(cmd.parameters['class'],classdef);
        return this;
    }

    public theme(theme:UITheme | string){
        const cmd = this.cmd;
        cmd.parameters['theme'] = typeof(theme) === 'string'? theme: UITheme[theme];
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

    public id(id:string){
        if(id == null) return;
        this.cmd.parameters['id'] = id;
        return this;
    }

    public on(evtname:string,cb?:Function,val?:any){

        let id = this.cmd.parameters['id'];
        if(id == null){
            id = this.ctx.genItemID(UIDrawCmdType.Element);
            this.cmd.parameters['id'] = id;
        }

        if(cb!=null){
            this.ctx.pushEventListener(id,evtname,cb);
        }

        let on = this.cmd.parameters['on'];
        if(on == null){
            on = {};
            this.cmd.parameters['on'] = on;
        }
        on[evtname] = val;
        return this;
    }

    public attrs(attr:{[key:string]:any}){
        if(attr == null) return;
        this.cmd.parameters['attrs'] = attr;
        return this;
    }

    public props(prop:{[key:string]:any}){
        if(prop == null) return;
        this.cmd.parameters['props'] = prop;
        return this;
    }
}

export class UIContext{
    private m_data:UIFrameData;
    private m_eventRegister:Map<String,Map<String,Function>> = new Map();
    private m_idbuilder = {};
    private m_actionIds:Map<UIActionType,number> = new Map();

    public actions:UIActionData[] = [];

    private define_style:{[key:string]:any} = {};
    private define_script:{[key:string]:any} = {};
    public define_updateList:UIDefineData[] = [];

    public bindingSource:UISource;

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
        return new UIDrawCmdBuilder(cmd,this);
    }

    public pushAction(data:UIActionData){
        this.actions.push(data);
    }

    public pushDefine(data:UIDefineData){
        if(data == null) return;
        switch(data.type){
            case UIDefineType.style:
            {
                const defineStyle = this.define_style;
                if(defineStyle[data.key] == null){
                    defineStyle[data.key] = JSON.stringify(data.value);
                }
                else{
                    let curval = defineStyle[data.key];
                    let newval = JSON.stringify(data.value);
                    if(curval == newval){
                        return;
                    }
                    defineStyle[data.key] = newval;
                }
            }
            break;
            case UIDefineType.script:
            {
                const defineScript = this.define_script;
                if(defineScript[data.key] == null){
                    defineScript[data.key] = data.value;
                }else{
                    let curval = defineScript[data.key];
                    let newval = data.value;
                    
                    if(JSON.stringify(curval) == JSON.stringify(newval)){
                        return;
                    }
                }
            }
            break;
        }
        this.define_updateList.push(data);
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

    public define(type:UIDefineType,key:string,value:any){
        var data = new UIDefineData(type,key,value);
        this.pushDefine(data);
    }

    public evaluate(code:string){
        this.bindingSource.MessageEvalEmit(new UIEvalData(0,code,false));
    }
    public async evaluateRet(code:string):Promise<any>{
        let result = await this.bindingSource.MessageEvalEmit(new UIEvalData(0,code,true));
        if(result==null) return null;
        return result.ret;
    }

    public html(html:string):UIDrawCmdBuilder{
        return this.pushCmd(UIDrawCmdType.HTML,{
            html:html.trim()
        });
    }

    public element(tag:string,text?:string):UIDrawCmdBuilder{
        return this.pushCmd(UIDrawCmdType.Element,{
            text:text,
            tag:tag
        });
    }

    public beginChildren():void{
        this.pushCmd(UIDrawCmdType.BeginChildren);
    }

    public endChildren():void{
        this.pushCmd(UIDrawCmdType.EndChildren);
    }

    public button(text:string,click?:Function):UIDrawCmdBuilder{
        let id = this.genItemID(UIDrawCmdType.Button);
        if(click !=null){
            this.pushEventListener(id,'click',click);
        }
        return this.pushCmd(UIDrawCmdType.Button,{
            text:text,
            click:click!=null,
            id:id,
        }).style({});
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

    public formInput(label:string,text:string,type:"email"|"password"|"text"|"number"|"datetime",finish?:(val:string)=>void){
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