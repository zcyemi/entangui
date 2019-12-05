export enum UIMessageType{
    init = 0,
    frame = 1,
    evt = 2,
    action =3,
}

export enum UITheme{
    primary,
    secondary,
    success,
    danger,
    warning,
    info,
    light,
    dark,
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

    CollapseBegin,
    CollapseEnd,
    TabBegin,
    TabEnd,

    FormBegin,
    FormEnd,
    FormSelect,
    FormInput,
    FormCheckbox,
    FormTextArea,
    FormRangeInput,
    FormRadio,

    Element,
    BeginChildren,
    EndChildren,
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
