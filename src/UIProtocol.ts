export enum UIMessageType{
    init = 0,
    frame = 1,
    evt = 2,
    action =3,
}

export class UIMessage{
    public type:UIMessageType;
    public ts:number;
    public data:any;

    public constructor(type:UIMessageType,data:any){
        this.type = type;
        this.data = data;
    }

    public attachTs(){
        this.ts = new Date().valueOf();
    }
}

export enum UIDrawCmdType{
    BeginGroup,
    EndGroup,
    Button,
    Text,
    Alert,
    Bandage,
    SidebarBegin,
    SidebarEnd,
    SidebarItem,
    FlexBegin,
    FlexEnd,
    FlexItemBegin,
    FlexItemEnd,
    Input,
    Divider,
    CardBegin,
    CardEnd,
    ListBegin,
    ListItemNext,
    ListEnd,
}


export enum UIActionType{
    Toast,
    Query,
    Notification,
}

export class UIFrameData{
    public frameid:number;
    public draw_commands:UIDrawCmd[] = [];
}

export class UIEventData{
    public id:string;
    public evt:string;
    public data:any;
}

export class UIActionData{
    public id:string;
    public action:UIActionType;
    public data:any;

    public constructor(id:string,action:UIActionType,data:any){
        this.id = id;
        this.action = action;
        this.data = data;
    }
}

export class UIDrawCmd{
    public cmd:UIDrawCmdType;
    public parameters:object;
}

export class UIEventListener{
    public id:string;
    public type:string;
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
        var action:Function = idmap.get(evt.evt);
        if(action !=null){
            action(evt.data);
            return true;
        }
        return false;
    }

    public pushCmd(type:UIDrawCmdType,parameter?:any){
        var cmd=  new UIDrawCmd();
        cmd.cmd = type;
        cmd.parameters =parameter;

        this.m_data.draw_commands.push(
            cmd
        )
        return this;
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

    public button(text:string,theme:string =null,click?:Function){

        let id = this.genItemID(UIDrawCmdType.Button);
        if(click !=null){
            this.pushEventListener(id,'click',click);
        }
        return this.pushCmd(UIDrawCmdType.Button,{
            text:text,
            click:click!=null,
            theme: theme,
            id:id
        });
    }

    public text(text:string,tag:string='p'){
        return this.pushCmd(UIDrawCmdType.Text,{
            text:text,
            tag:tag
        });
    }

    public bandage(text:string){
        return this.pushCmd(UIDrawCmdType.Bandage,{text:text});
    }

    public alert(text:string){
        return this.pushCmd(UIDrawCmdType.Alert,{
            text:text
        });
    }

    public input(label:string,text:string,finish?:(val:string)=>void){
        let id = this.genItemID(UIDrawCmdType.Input);
        this.pushEventListener(id,'finish',finish);

        return this.pushCmd(UIDrawCmdType.Input,{
            'text':text,
            'label':label,
            'id':id,
            'finish':finish!=null
        });
    }

    public divider(){
        return this.pushCmd(UIDrawCmdType.Divider);
    }

    public beginGroup(padidng:string = '3px'){
        return this.pushCmd(UIDrawCmdType.BeginGroup,{
            padding:padidng
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

    public FlexItemBegin(width?:string){
        return this.pushCmd(UIDrawCmdType.FlexItemBegin,{
            'width':width
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

    public actionToast(title:string,msg:string):string{
        let id  =this.getActionId(UIActionType.Toast);
        var data = new UIActionData(id,UIActionType.Toast,{title:title,msg:msg});
        this.pushAction(data);
        return id;
    }
    

}