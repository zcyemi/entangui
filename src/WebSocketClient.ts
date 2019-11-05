

export class WebSockertClient{

    private m_socket:WebSocket;

    public onReceive:(msg:string)=>void;

    public constructor(){

    }

    public connect(ip:string,port:number){

        let socket = this.m_socket;
        if(socket != null){
            socket.close(-1);
        }
        socket = new WebSocket(`wss://${ip}:${port}`);
        socket.addEventListener("open",this.onOpen.bind(this));        
        socket.addEventListener("message",this.onMessage.bind(this));
        socket.addEventListener('close',this.onClose.bind(this));
        socket.addEventListener('close',this.onError.bind(this));

        this.m_socket = socket;
    }

    public send(msg:string){
        this.m_socket.send(msg);
    }

    private onOpen(evt:Event){

        this.m_socket.send("init");
    }
    
    private onMessage(evt:MessageEvent){
        console.log(evt);
        const onmsg = this.onReceive;
        if(onmsg!=null){
            onmsg(evt.data);
        }
    }



    private onClose(evt:Event){
        console.log(evt);
    }

    private onError(evt:Event){
        console.log(evt);
    }
}