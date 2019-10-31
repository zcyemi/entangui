

export enum UIDrawCmdType{
    begin_group,
    end_group,
    button,
    text,
    alert,
}

export class UIFrameData{
    public frameid:number;
    public draw_commands:UIDrawCmd[] = [];
}

export class UIEventData{
    public id:string;
    public event:string;
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


    public constructor(){

    }

    public dispatchEvent(evt:UIEventData){
        let registry = this.m_eventRegister;
        let idmap = registry.get(evt.id);
        if(idmap == null) return;
        var action:Function = idmap.get(evt.event);
        if(action !=null){
            action();
        }

    }

    public beginFrame(){
        this.m_data =new UIFrameData();
        return this;
    }
    public endFrame():UIFrameData{
        return this.m_data;
    }

    public button(id:string,text:string,click?:Function){
        if(click !=null){
            this.pushEventListener(id,'click',click);
        }
        return this.pushCmd(UIDrawCmdType.button,{
            text:text,
            click:click!=null,
            id:id
        });
    }

    public alert(text:string){
        return this.pushCmd(UIDrawCmdType.alert,{
            text:text
        });
    }
    public beginGroup(padidng:string = '3px'){
        return this.pushCmd(UIDrawCmdType.begin_group,{
            padding:padidng
        });
    }
    public endGroup(){
        return this.pushCmd(UIDrawCmdType.end_group);
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

    public pushEventListener(id:string,event:string,action:Function){
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
}

