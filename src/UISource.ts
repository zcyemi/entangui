import { UIActionData, UIEventData, UIFrameData, UIDefineData, UIEvalRetData, UIEvalData } from "./UIProtocol";
import { UIRenderer } from "./UIRender";


export abstract class UISource {

    public MessageFrameCallback: (data: UIFrameData) => void;
    public MessageActionCallback:(data:UIActionData) =>void;
    public MessageDefineCallback:(data:UIDefineData[])=>void;
    public MessageEvalEmit:(data:UIEvalData)=>Promise<UIEvalRetData>;

    public constructor() {
    }

    public abstract sendUIEvent(evt: UIEventData);
    public Render() { }
}



export function UIRenderingBind(source: UISource, render: UIRenderer) {
    source.MessageFrameCallback = (data) => render.onUIFrame(data);
    source.MessageActionCallback = (data) => render.onUIAction(data);
    source.MessageDefineCallback = (data)=> render.onUIDefine(data);
    source.MessageEvalEmit = data=>render.onUIEval(data);

    render.MessageEventCallback = (data) => source.sendUIEvent(data);

    source.Render();
}