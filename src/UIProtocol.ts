export enum UIMessageType{
    init = 0,
    frame = 1,
    evt = 2,
    action =3,
    define = 4,
    eval =5,
    eval_ret = 6,
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

    HTML,

    Icon,
}


export enum UIDefineType{
    script = 0,
    style = 1,
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

export class UIDefineData{
    public key:string;
    public type:UIDefineType;
    public value:any;

    public constructor(type:UIDefineType,key:string,value:any){
        this.key= key;
        this.type = type;
        this.value = value;
    }
}

export class UIEvalData{
    public id:number;
    public code:string;
    public ret:boolean;
    public constructor(id:number,code:string,ret:boolean){
        this.id = id;
        this.code = code;
        this.ret = ret;
    }
}

export class UIEvalRetData{
    public id:number;
    public ret:any;
    public constructor(id:number,ret:any){
        this.id = id;
        this.ret = ret;
    }
}

export class UIPrefData{
    public key:string;
    public type:number;
    public value:any;
}

export class UIDrawCmd{
    public cmd:UIDrawCmdType;
    public parameters:object;
}

export class UIEventListener{
    public id:string;
    public type:string;
}
