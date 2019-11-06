import { UIContainer } from "./UIContainer";
import { UIActionData, UIEventData, UIFrameData, UIMessage, UIMessageType } from "./UIProtocol";
import { UIRenderer } from "./UIRender";



export abstract class UISource {

    public MessageFrameCallback: (data: UIFrameData) => void;
    public MessageActionCallback:(data:UIActionData) =>void;

    public constructor() {
    }

    public abstract sendUIEvent(evt: UIEventData);
    public Render() { }
}

export class UISourceLocal extends UISource {

    private m_container: UIContainer;
    public constructor(uicontainer: UIContainer) {
        super();
        this.m_container = uicontainer;

        window.requestAnimationFrame(this.onUpdate.bind(this))

    }

    public onUpdate(){

        let container = this.m_container;

        let actions = container.actions;
        if(actions!=null){
            container.actions = [];

            let actioncb = this.MessageActionCallback;
            if(actioncb!=null){
                actions.forEach(data=>{
                    actioncb(data);
                })
            }
        }

        if(container.isDirty){
            this.Render();
        }




        setTimeout(() => {
            window.requestAnimationFrame(this.onUpdate.bind(this));
        }, 200);
    }

    public sendUIEvent(evt: UIEventData) {
        var update = this.m_container.dispatchEvent(evt);
        if (update) {
            this.Render();
        }
    }


    public Render() {
        var framcb = this.MessageFrameCallback;
        if (framcb != null) {
            framcb(this.m_container.update());
        }
    }

}

export class UISourceSocket extends UISource {

    private m_socket: WebSocket;

    private m_pendingMsg: UIMessage[] = [];
    private m_port:number;
    private m_ip:string;

    public EventLogs:(msg:string)=>void;

    public constructor(ip: string, port: number) {
        super();
        this.m_ip = ip;
        this.m_port = port;
    }

    public setIp(ip:string){
        this.m_ip = ip;
    }

    public connect() {

        let socket = this.m_socket;
        if (socket != null) {
            if (socket.readyState == WebSocket.CONNECTING || socket.readyState == WebSocket.OPEN) {
                return;
            }
        }

        socket = new WebSocket(`wss://${this.m_ip}:${this.m_port}`);
        this.m_pendingMsg = [];

        socket.addEventListener("open", this.onOpen.bind(this));
        socket.addEventListener("message", this.onMessage.bind(this));
        socket.addEventListener('close', this.onClose.bind(this));
        socket.addEventListener('close', this.onError.bind(this));

        this.m_socket = socket;
    }

    private get socketStatus(): number {
        return this.m_socket.readyState;
    }

    public sendUIEvent(evt: UIEventData) {
        if (evt == null) return;

        let msg = new UIMessage(UIMessageType.evt, evt);
        msg.attachTs();
        this.connect();
        if (this.socketStatus == WebSocket.OPEN) {
            this.m_socket.send(JSON.stringify(msg));
        }
        else {
            this.m_pendingMsg.push(msg);
        }
    }

    private onOpen(evt: Event) {
        this.log('socket open');
        let msg = new UIMessage(UIMessageType.init, null);
        this.m_socket.send(JSON.stringify(msg));
    }

    private onMessage(evt: MessageEvent) {
        var data = evt.data;

        var msg: UIMessage = JSON.parse(data);
        if (msg == null) {
            console.log("unprocess message: " + data);
            return;
        }

        this.log(`socket msg: ${UIMessageType[msg.type]}`);

        switch (msg.type) {
            case UIMessageType.frame:
                var framdata: UIFrameData = msg.data;
                if (framdata == null) {
                    console.error("ui framedata is null");
                }
                if (this.MessageFrameCallback != null) {
                    this.MessageFrameCallback(framdata);
                }
                break;
            case UIMessageType.action:
                var actdata:UIActionData = msg.data;
                if(actdata ==null){
                    console.error("ui actiondata is null");
                }
                if (this.MessageActionCallback != null) {
                    this.MessageActionCallback(actdata);
                }
                break;
        }
    }

    private log(obj:any){
        let evtlogs= this.EventLogs;
        if(evtlogs !=null){
            evtlogs(obj);
        }
    }

    private onClose(evt: Event) {
        this.log('socket close');
    }

    private onError(evt: CloseEvent) {
        this.log(`socket error: ${evt.code}`);
    }

    public Render() { }
}

export function ServiceBind(source: UISource, render: UIRenderer) {
    source.MessageFrameCallback = (data) => render.onUIFrame(data);
    source.MessageActionCallback = (data) => render.onUIAction(data);
    render.MessageEventCallback = (data) => source.sendUIEvent(data);
    source.Render();
}