

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
    public event_reg:UIEventReg[] = [];
}

export class UIDrawCmd{
    public cmd:UIDrawCmdType;
    public parameters:object;
}

export class UIEventReg{
    public id:string;
    public type:string;
}


export class UIFrameDataBuilder{


    private m_data:UIFrameData;

    public constructor(){

    }

    public beginFrame(){
        this.m_data =new UIFrameData();
        return this;
    }
    public endFrame():UIFrameData{
        return this.m_data;
    }

    public button(text:string){
        return this.pushCmd(UIDrawCmdType.button,{
            text:text
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
}

