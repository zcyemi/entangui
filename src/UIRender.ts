import { h, init } from "snabbdom";
import classModule from 'snabbdom/modules/class';
import eventListenersModule from 'snabbdom/modules/eventlisteners';
import propsModule from 'snabbdom/modules/props';
import styleModule from 'snabbdom/modules/style';
import toVNode from "snabbdom/tovnode";
import { VNode } from "snabbdom/vnode";
import { UIBuilder } from "./UIBuilder";
import { UIActionData, UIActionType, UIDrawCmdType, UIEventData, UIFrameData } from "./UIProtocol";
import attributesModule from "snabbdom/modules/attributes";
import datasetModule from "snabbdom/modules/dataset";


var patchConfig = init([
    propsModule,
    classModule,
    styleModule,
    eventListenersModule,
    attributesModule,
    datasetModule,
]);

export class UIRenderer {
    private m_vnodePrev: VNode;
    private m_html: HTMLElement;

    private m_builder: UIBuilder;

    private static s_internalDiv:HTMLDivElement;

    public MessageEventCallback: (evt: UIEventData) => void;

    public constructor(html: HTMLElement) {

        if(UIRenderer.s_internalDiv == null){
            let div = document.body.appendChild(document.createElement('div'));
            div.id = "entangui-div";
            UIRenderer.s_internalDiv = div;
            UIRenderer.sharedUIinit();
        }

        this.m_html = html;
        this.m_vnodePrev = toVNode(html);

        this.m_builder = new UIBuilder(this.onMessageEvent.bind(this),UIRenderer.s_internalDiv);
    }


    private onMessageEvent(evt: UIEventData) {
        let cb = this.MessageEventCallback;
        if (cb != null) {
            cb(evt);
        }
    }
    

    public onUIAction(data:UIActionData){
        let builder = this.m_builder;
        var method = `action${UIActionType[data.action]}`;
        builder[method](data.id,data.data);
    }

    public onUIFrame(data: UIFrameData) {

        let builder = this.m_builder;
        builder.beginChildren();

        var drawcmd = data.draw_commands;
        drawcmd.forEach(draw => {
            var parameters = draw.parameters;
            let method = `cmd${UIDrawCmdType[draw.cmd]}`;
            builder[method](parameters);
        });

        builder.endChildren();
        this.m_vnodePrev = patchConfig(this.m_vnodePrev, builder.rootNode);
        builder.resetRootNode();
    }

    private static sharedUIinit(){
        let toastroot = `<div id="entangui-toastroot" aria-live="polite" aria-atomic="true" style="min-height: 200px;"></div>`;
        let root = UIRenderer.s_internalDiv;
        root.appendChild(UIRenderer.buildDom(toastroot));
    }

    public static sharedUIPushDom(id:string|HTMLElement,html:HTMLElement){
        if(id instanceof HTMLElement){
            id.appendChild(html);
        }
        else{
            let root = document.getElementById(id);
            root.appendChild(html);
        }
    }

    public static sharedUIPushHTML(id:string|HTMLElement,html:string){
        let dom = UIRenderer.buildDom(html);
        if(dom ==null) return;
        UIRenderer.sharedUIPushDom(id,dom);
    }


    public static buildDom(xmlstr:string):HTMLElement{
        return <HTMLElement>(new DOMParser().parseFromString(xmlstr, "text/xml").firstElementChild);
    }
    
}
