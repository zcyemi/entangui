import { UIDrawCmdType, UIActionType, UIActionData, UIFrameData, UIEventListener, UIEventData, UIDrawCmd, UITheme, UIDefineData, UIDefineType, UIEvalData } from "./UIProtocol";
import { UISource } from "./UISource";
import { UIDomElement } from "./UIFactory";


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

export class UIFormOptions{
    public action:string;
    public enctype:string = "multipart/form-data";
    public method:string = "POST";

    public constructor(method?:"POST" | "GET" | string,action?:string,enctype?:string){
        if(method!=null) this.method = method;
        if(action !=null) this.action = action;
        if(enctype!=null) this.enctype = enctype;
    }
}

export class UIDrawCmdBuilder{


    public cmd:UIDrawCmd;
    private ctx:UIContext;
    public consumed:boolean =false;

    public constructor(cmd:UIDrawCmd,ctx:UIContext){
        this.cmd = cmd;
        this.ctx = ctx;
    }

    public classes(... classdef:string[]){
        const cmd = this.cmd;
        let parameters = cmd.parameters;
        if(cmd.parameters == null) cmd.parameters = {};
        cmd.parameters['class'] = MergeArray(cmd.parameters['class'],classdef);
        return this;
    }

    public theme(theme:UITheme | string){
        const cmd = this.cmd;
        if(this.cmd.parameters == null) this.cmd.parameters = {};
        cmd.parameters['theme'] = typeof(theme) === 'string'? theme: UITheme[theme];
        return this;
    }

    public style(style:any){
        const cmd = this.cmd;
        if(cmd.parameters == null) cmd.parameters = {};
        let parameters = cmd.parameters;
        cmd.parameters['style'] = MergeObject(parameters['style'],style);
        return this;
    }

    public property(key:string,val:any){
        const cmd = this.cmd;
        if(this.cmd.parameters == null) this.cmd.parameters = {};
        cmd.parameters[key] = val;
        return this;
    }

    public id(id:string){
        if(id == null) return this;
        if(this.cmd.parameters == null) this.cmd.parameters = {};
        this.cmd.parameters['id'] = id;
        return this;
    }

    public on(evtname:string,cb?:Function,val?:any){
        let cmd = this.cmd;
        if(cmd.parameters == null) cmd.parameters = {};
        let id = cmd.parameters['id'];
        if(id == null){
            id = this.ctx.genItemID(UIDrawCmdType.Element);
            cmd.parameters['id'] = id;
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
        if(attr == null) return this;
        if(this.cmd.parameters == null) this.cmd.parameters = {};
        this.cmd.parameters['attrs'] = attr;
        return this;
    }

    public props(prop:{[key:string]:any}):UIDrawCmdBuilder{
        if(prop == null) return this;
        if(this.cmd.parameters == null) this.cmd.parameters = {};
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

    private m_drawCmdBuffer:UIDrawCmdBuilder[] = [];

    private emitDrawCommand(builder:UIDrawCmdBuilder){
        this.m_drawCmdBuffer.push(builder);
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

        let builder = new UIDrawCmdBuilder(cmd,this);
        this.emitDrawCommand(builder);
        return builder;
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
        this.m_drawCmdBuffer =[];
        return this;
    }
    public endFrame():UIFrameData{
        let cmdbuffer= this.m_drawCmdBuffer;
        let drawcmds = this.m_data.draw_commands;
        if(cmdbuffer!=null){
            let len = cmdbuffer.length;
            for(let t=0;t<len;t++){
                let builder = cmdbuffer[t];
                if(!builder.consumed){
                    drawcmds.push(builder.cmd);
                }
            }

        }

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

    public actionNotify(title:string,msg:string,finish?:Function,tex_confirm?:string){
        let id = this.getActionId(UIActionType.Notify);
        var data= new UIActionData(id,UIActionType.Notify,{
            title:title,
            msg:msg,
            text_confirm: tex_confirm,
            finish:finish!=null
        });

        if(finish){
            this.pushEventListener(id,'finish',finish);
        }
        this.pushAction(data);
        return id;
    }

    public define(type:UIDefineType,key:string,value:any){
        var data = new UIDefineData(type,key,value);
        this.pushDefine(data);
    }

    public js(key:string,value:string){
        this.pushDefine(new UIDefineData(UIDefineType.script,key,value));
    }
    public css(sel:string,value:any){
        this.pushDefine(new UIDefineData(UIDefineType.style,sel,value));
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

    public formSubmitAjsx(formid:string,success:(data)=>void,failed:(err)=>void){
        var form = $(`form#${formid}`);
            var formData =new FormData(form.get(0) as HTMLFormElement);
                $.ajax({
                    type:'POST',
                    url:form.attr('action'),
                    data:formData,
                    cache:false,
                    processData:false,
                    contentType:false,
                    success:success,
                    error:failed,
                });
    }

    public buttonGroupBegin(){
        return this.pushCmd(UIDrawCmdType.ButtonGroupBegin);
    }

    public buttonGroupEnd(){
        return this.pushCmd(UIDrawCmdType.ButtonGroupEnd);
    }

    public jsx(element:UIDomElement):UIDrawCmdBuilder{
        if(element == null) return;
        let id = element.id || this.genItemID(UIDrawCmdType.JSX);
        return this.pushCmd(UIDrawCmdType.JSX,{
            dom:element
        }).style({}).id(id);
    }

    public icon(type:string){
        return this.pushCmd(UIDrawCmdType.Icon,{
            icon:type
        });
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

    public treeBegin(label:string){
        return this.pushCmd(UIDrawCmdType.TreeBegin,{
            label:label
        });
    }

    public treeEnd(){
        return this.pushCmd(UIDrawCmdType.TreeEnd);
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
        let id = this.genItemID(UIDrawCmdType.CollapseBegin);
        return this.pushCmd(UIDrawCmdType.CollapseBegin,{title:title,id:id});
    }

    public collapseEnd(){
        return this.pushCmd(UIDrawCmdType.CollapseEnd);
    }

    public formBegin(id?:string,formOpts?:UIFormOptions){
        if(id == null){
            id = this.genItemID(UIDrawCmdType.FormBegin);
        }
        return this.pushCmd(UIDrawCmdType.FormBegin).props(formOpts).id(id);
    }

    public formEnd(){
        return this.pushCmd(UIDrawCmdType.FormEnd);
    }

    public formInput(label:string,text:string,type:"email"|"password"|"text"|"number"|"datetime"| "file",name?:string,finish?:(val:string)=>void){
        let id = this.genItemID(UIDrawCmdType.FormInput)+label.replace(' ','');

        this.pushEventListener(id,'finish',finish);
        return this.pushCmd(UIDrawCmdType.FormInput,{
            label:label,
            text:text,
            type:type,
            id:id,
            finish:finish!=null,
            name:name
        });
    }


    public formNumber(label:string,val:number,finish?:(val:number)=>void){
        let id = this.genItemID(UIDrawCmdType.FormNumber);
        this.pushEventListener(id,'finish',finish);
        return this.pushCmd(UIDrawCmdType.FormNumber,{
            label:label,
            value:val,
            id:id,
            finish:finish!=null
        });
    }

    public formVec2(label:string,val:number[],finish?:(val:number[])=>void){
        let id = this.genItemID(UIDrawCmdType.FormVec2);
        this.pushEventListener(id,'finish',finish);
        return this.pushCmd(UIDrawCmdType.FormVec2,{
            label:label,
            value:val,
            id:id,
            finish:finish!=null
        });
    }

    public formVec3(label:string,val:number[],finish?:(val:number[])=>void){
        let id = this.genItemID(UIDrawCmdType.FormVec3);
        this.pushEventListener(id,'finish',finish);
        return this.pushCmd(UIDrawCmdType.FormVec3,{
            label:label,
            value:val,
            id:id,
            finish:finish!=null
        });
    }

    public formVec4(label:string,val:number[],finish?:(val:number[])=>void){
        let id = this.genItemID(UIDrawCmdType.FormVec4);
        this.pushEventListener(id,'finish',finish);
        return this.pushCmd(UIDrawCmdType.FormVec4,{
            label:label,
            value:val,
            id:id,
            finish:finish!=null
        });
    }

    public formButton(label:string,click?:(formid:string)=>void){
        let id = this.genItemID(UIDrawCmdType.FormButton);
        this.pushEventListener(id,"click",click);
        return this.pushCmd(UIDrawCmdType.FormButton,{
            label:label,
            id:id,
            click:click!=null
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

    public formSelect(label:string,items:{[key:string]:string},key?:string,change?:(key:string)=>void){
        let id = this.genItemID(UIDrawCmdType.FormSelect);
        this.pushEventListener(id,'change',change);
        return this.pushCmd(UIDrawCmdType.FormSelect,{
            label:label,
            items:items,
            value:key,
            id:id,
            change:change!=null
        });
    }

    public contextBegin(ctxid:string,theme?:'none' | 'overlay' | 'mask'){
        return this.pushCmd(UIDrawCmdType.ContextBegin,{
            id:ctxid,
            theme:theme
        });
    }

    public contextEnd(ctxid:string){
        this.pushCmd(UIDrawCmdType.ContextEnd,{
            id:ctxid
        });
    }

}