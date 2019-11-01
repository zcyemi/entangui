import { init } from 'snabbdom';
import classModule from 'snabbdom/modules/class';
import eventListenersModule from 'snabbdom/modules/eventlisteners';
import propsModule from 'snabbdom/modules/props';
import styleModule from 'snabbdom/modules/style';
import toVNode from 'snabbdom/tovnode';
import { VNode } from 'snabbdom/vnode';
import { UIBuilder } from "./UIBuilder";
import { UIContainer } from "./UIContainer";
import { UIDrawCmdType, UIEventData, UIFrameData, UIMessage, UIMessageType } from "./UIProtocol";

var patchConfig = init([
    propsModule,
    classModule,
    styleModule,
    eventListenersModule,
]);

export class UIRenderer{

    private m_vnodePrev:VNode;
    private m_html:HTMLElement;

    private m_builder: UIBuilder;


    public MessageEventCallback: (evt:UIEventData)=>void;

    public constructor(html:HTMLElement){
        this.m_html = html;
        this.m_vnodePrev = toVNode(html);

        this.m_builder = new UIBuilder(this.onMessageEvent.bind(this));
    }

    private onMessageEvent(evt:UIEventData){
        let cb = this.MessageEventCallback;
        if(cb !=null){
            cb(evt);
        }
    }

    public onUIFrame(data:UIFrameData){

        let builder = this.m_builder;
        builder.beginChildren();

        var drawcmd= data.draw_commands;
        drawcmd.forEach(draw=>{
            var parameters = draw.parameters;
            switch(draw.cmd){
                case UIDrawCmdType.begin_group:
                builder.cmdBeginGroup(parameters);
                break;
                case UIDrawCmdType.end_group:
                builder.cmdEndGroup();
                break;
                case UIDrawCmdType.button:
                builder.cmdButton(parameters);
                break;
                case UIDrawCmdType.alert:
                builder.cmdAlert(parameters);
                break;
            }
        })

        builder.endChildren();

        this.m_vnodePrev = patchConfig(this.m_vnodePrev,builder.rootNode);
        builder.resetRootNode();
    }
}

export abstract class UISource{

    public MessageFrameCallback:(data:UIFrameData)=>void;

    public constructor(){
    }

    public abstract sendUIEvent(evt:UIEventData);
    public Render(){}
}

export class UISourceLocal extends UISource{

    private m_container:UIContainer;
    public constructor(uicontainer:UIContainer){
        super();
        this.m_container = uicontainer;
    }

    public sendUIEvent(evt: UIEventData) {
        var update = this.m_container.context.dispatchEvent(evt);
        if(update){
            this.Render();
        }
    }

    public Render(){
        var framcb = this.MessageFrameCallback;
        if(framcb!=null){
            framcb(this.m_container.update());
        }
    }
}

export class UISourceSocket extends UISource{

    private m_ws:string;
    private m_socket:WebSocket;

    private m_pendingMsg:UIMessage[] = [];

    public constructor(ip:string,port:number){
        super();
        this.m_ws = `ws://${ip}:${port}`;
    }

    public connect(){

        let socket = this.m_socket;
        if(socket !=null){
            if(socket.readyState == WebSocket.CONNECTING || socket.readyState == WebSocket.OPEN){
                return;
            }
        }

        socket = new WebSocket(this.m_ws);
        this.m_pendingMsg = [];

        socket.addEventListener("open",this.onOpen.bind(this));        
        socket.addEventListener("message",this.onMessage.bind(this));
        socket.addEventListener('close',this.onClose.bind(this));
        socket.addEventListener('close',this.onError.bind(this));

        this.m_socket = socket;
    }

    private get socketStatus():number{
        return this.m_socket.readyState;
    }

    public sendUIEvent(evt:UIEventData){
        if(evt == null) return;

        let msg = new UIMessage(UIMessageType.evt,evt);
        msg.attachTs();
        this.connect();
        if(this.socketStatus == WebSocket.OPEN){
            this.m_socket.send(JSON.stringify(msg));
        }
        else{
            this.m_pendingMsg.push(msg);
        }
    }

    private onOpen(evt:Event){
        let msg = new UIMessage(UIMessageType.init,null);
        this.m_socket.send(JSON.stringify(msg));
    }
    
    private onMessage(evt:MessageEvent){
        var data = evt.data;
        
        var msg:UIMessage = JSON.parse(data);
        if(msg  == null){
            console.log("unprocess message: "+ data);
            return;
        }

        switch(msg.type){
            case UIMessageType.frame:
                var framdata:UIFrameData = msg.data;
                if(framdata == null){
                    console.error("ui framedata is null");
                }
                if(this.MessageFrameCallback!=null){
                    this.MessageFrameCallback(framdata);
                }
            break;
        }
    }


    private onClose(evt:Event){
        console.log(`socket close: ${evt}`);
    }

    private onError(evt:Event){
        console.error(`socket error: ${evt}`);
    }

    public Render(){}
}

export function ServiceBind(source:UISource,render:UIRenderer){
    source.MessageFrameCallback = (data)=> render.onUIFrame(data);
    render.MessageEventCallback = (data)=> source.sendUIEvent(data);
    source.Render();
}