import { UIRenderer, UISourceSocket, UISourceLocal, ServiceBind } from "./UIService";
import { UIContext } from "./UIProtocol";
import { UIContainer } from "./UIContainer";
import { WebSockertClient } from "./WebSocketClient";

var container = document.getElementById("container");
var menubar = document.getElementById('menubar');

class UIHeaderBar extends UIContainer{

    private m_msg:string;


    private m_render:UIRenderer;
    private m_sourceSocket:UISourceSocket;

    public constructor(){
        super();
        var renderContainer = new UIRenderer(container);
        var uisource =new UISourceSocket("127.0.0.1",5500);
        uisource.EventLogs = (msg)=>{
            this.m_msg= msg;
            this.setDirty();
        }

        this.m_render =renderContainer;
        this.m_sourceSocket = uisource;
        
        ServiceBind(uisource,renderContainer);
    }

    protected OnGUI() {

        var socket = this.m_sourceSocket;

        var self = this;
        this.beginGroup('5px');
        {
            this.button("btn-conn",'Connect',()=>{
                socket.connect();
            });

            this.text(this.m_msg);
        }
        this.endGroup();

    }
}

var renderMenuBar = new UIRenderer(menubar);
var uisourecLocal = new UISourceLocal(new UIHeaderBar());

ServiceBind(uisourecLocal,renderMenuBar);



