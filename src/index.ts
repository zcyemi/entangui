import { UIRenderer, UISourceSocket, UISourceLocal, ServiceBind } from "./UIService";
import { UIContext } from "./UIProtocol";
import { UIContainer } from "./UIContainer";
import { WebSockertClient } from "./WebSocketClient";

var container = document.getElementById("container");
var menubar = document.getElementById('menubar');

class TestUI extends UIContainer{
    private m_showbtn2:boolean = false;

    protected onGUI(builder:UIContext){

        var self = this;
        builder.beginGroup('5px');
        {
            builder.button("btn1",'clickme1',()=>{
                self.m_showbtn2 = !self.m_showbtn2;
            });

            if(self.m_showbtn2){
                builder.button("btn2",'clickme2');
            }
            builder.alert("test alert");
        }
        builder.endFrame();
    }
}

var renderMenuBar = new UIRenderer(menubar);
var uisourecLocal = new UISourceLocal(new TestUI());

ServiceBind(uisourecLocal,renderMenuBar);

var renderContainer = new UIRenderer(container);
var uisource =new UISourceSocket("127.0.0.1",5500);

ServiceBind(uisource,renderContainer);

