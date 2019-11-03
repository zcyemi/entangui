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

    private m_lastValidIpAddr:string = "127.0.0.1";

    public constructor(){
        super();
        var renderContainer = new UIRenderer(container);
        var uisource =new UISourceSocket("192.168.89.15",5566);
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

        this.beginGroup('5px');
        {

            this.flexBegin();
            this.button("btn-conn",'Connect',()=>{
                socket.connect();
            });
            this.input("deviceIp",this.m_lastValidIpAddr,(val)=>{
                console.log(val);

                if(val.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)){
                    this.m_lastValidIpAddr = val;
                    this.m_sourceSocket.setIp(val);
                }
            });
            this.flexEnd();
            this.text(this.m_msg);


            this.listBegin(false);

            this.text('item1','span');
            this.listItemNext();
            this.text('dwdwww','span');
            this.listItemNext();
            this.button("dwdw",'ewwqqq');

            this.listEnd();
        }
        this.endGroup();

    }
}

var renderMenuBar = new UIRenderer(menubar);
var uisourecLocal = new UISourceLocal(new UIHeaderBar());

ServiceBind(uisourecLocal,renderMenuBar);



