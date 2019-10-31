import { init } from 'snabbdom';
import classModule from 'snabbdom/modules/class';
import eventListenersModule from 'snabbdom/modules/eventlisteners';
import propsModule from 'snabbdom/modules/props';
import styleModule from 'snabbdom/modules/style';
import toVNode from 'snabbdom/tovnode';
import { VNode } from 'snabbdom/vnode';
import { UIBuilder } from "./UIBuilder";
import { UIDrawCmdType, UIFrameData, UIEventData } from "./UIProtocol";

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