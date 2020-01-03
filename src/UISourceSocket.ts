import { UIActionData, UIEventData, UIFrameData, UIMessage, UIMessageType, UIDefineData, UIEvalRetData, UIEvalData } from "./UIProtocol";
import { UISource } from "./UISource";

export enum UISocketEvent {
    open,
    close,
    error,
    message,
}

export class UISourceSocket extends UISource {
    private m_socket: WebSocket;
    private m_pendingMsg: UIMessage[] = [];
    private m_port: number;
    private m_ip: string;
    public EventSocket: (evt: UISocketEvent, data: any) => void;

    private m_enableAutoConn:boolean = false;
    private m_autoConnHandler:any;

    public constructor(ip: string, port: number,autoConnect:boolean =false) {
        super();
        this.m_ip = ip;
        this.m_port = port;
        this.m_enableAutoConn = autoConnect;
    }

    public setIp(ip: string) {
        this.m_ip = ip;
    }

    public setPort(port:number){
        this.m_port = port;
    }

    public connect() {

        let socket = this.m_socket;
        if (socket != null) {
            if (socket.readyState == WebSocket.CONNECTING || socket.readyState == WebSocket.OPEN) {

                this.cancelAutoConnect();
                return;
            }
        }

        socket = new WebSocket(`ws://${this.m_ip}:${this.m_port}`);
        this.m_pendingMsg = [];

        socket.addEventListener("open", this.onOpen.bind(this));
        socket.addEventListener("message", this.onMessage.bind(this));
        socket.addEventListener('close', this.onClose.bind(this));
        socket.addEventListener('error', this.onError.bind(this));

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

    public sendUIEvalRet(data:UIEvalRetData){
        if(data == null) return;
        let msg = new UIMessage(UIMessageType.eval_ret,data);
        msg.attachTs();
        this.connect();
        if(this.socketStatus == WebSocket.OPEN){
            this.m_socket.send(JSON.stringify(msg));
        }
        else{
            this.m_pendingMsg.push(msg);
        }
    }

    private onOpen(evt: Event) {
        this.cancelAutoConnect();

        this.emitSocketEvent(UISocketEvent.open, evt);
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
        this.emitSocketEvent(UISocketEvent.message, { type: msg.type });

        switch (msg.type) {
            case UIMessageType.frame:
                {
                    var framdata: UIFrameData = msg.data;
                    if (framdata == null) {
                        console.error("ui framedata is null");
                    }
                    if (this.MessageFrameCallback != null) {
                        this.MessageFrameCallback(framdata);
                    }
                }
                break;
            case UIMessageType.action:
                {
                    var actdata: UIActionData = msg.data;
                    if (actdata == null) {
                        console.error("ui actiondata is null");
                    }
                    if (this.MessageActionCallback != null) {
                        this.MessageActionCallback(actdata);
                    }
                }
                break;
            case UIMessageType.define:
                {
                    var defdata = msg.data;
                    if(defdata == null){
                        return;
                    }
                    if(this.MessageDefineCallback !=null){
                        this.MessageDefineCallback(defdata);
                    }
                }
                break;
            case UIMessageType.eval:
                {
                    var evaldata:UIEvalData =msg.data;
                    if(evaldata !=null){
                        var code = evaldata.code;

                        var result:any = null;
                        if(code !=null){
                            result = eval(code);
                        }
                        if(evaldata.ret){
                            this.sendUIEvalRet(new UIEvalRetData(evaldata.id,JSON.stringify(result)));
                        }
                    }
                }
            break;
        }
    }

    private emitSocketEvent(evt: UISocketEvent, data: any) {
        if (this.EventSocket == null) return;
        let cb = this.EventSocket;
        cb(evt, data);
    }

    private onClose(evt: CloseEvent) {
        this.emitSocketEvent(UISocketEvent.close, { code: evt.code });

        if(this.m_enableAutoConn){
            this.startAutoConnect();
        }
    }

    private cancelAutoConnect(){
        let hander = this.m_autoConnHandler;
        if(hander!=null){
            clearInterval(hander);
            this.m_autoConnHandler = null;
        }
    }

    private startAutoConnect(){
        if(this.m_enableAutoConn){
            let handler = this.m_autoConnHandler;
            if(handler==null){
                this.m_autoConnHandler = setInterval(this.connect.bind(this),1000);
            }
        }
    }


    private onError(evt: Event) {
        this.emitSocketEvent(UISocketEvent.error, evt);
    }

    public Render() { }
}
