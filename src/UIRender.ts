import { h, init } from "snabbdom";
import classModule from 'snabbdom/modules/class';
import eventListenersModule from 'snabbdom/modules/eventlisteners';
import propsModule from 'snabbdom/modules/props';
import styleModule from 'snabbdom/modules/style';
import toVNode from "snabbdom/tovnode";
import { VNode } from "snabbdom/vnode";
import { UIBuilder } from "./UIBuilder";
import { UIActionData, UIActionType, UIDrawCmdType, UIEventData, UIFrameData, UIDefineData, UIEvalData, UIEvalRetData } from "./UIProtocol";
import attributesModule from "snabbdom/modules/attributes";
import datasetModule from "snabbdom/modules/dataset";
import { UIContainer } from "./UIContainer";
import { UIFrameBuilder } from "./UIFrameBuilder";


const INTERNAL_CSS = `
#wrap{
    overflow: hidden;
}
.sidebar{
    max-width: 250px;
    min-width: 250px;
    height: 100%;
    z-index: 999;
    transition: all 0.3s;
}
.sidebar-header{
    padding: 0.875rem 1.25rem;
    font-size: 1.2rem;
}
.sidebar-list{
    overflow: auto;
    -webkit-overflow-scrolling: touch;
}
#entangui-toastroot{
    position: absolute;
    top: 50vh;
    right: 20px;
}
.toast{
    min-width: 250px;
}
`;

var patchConfig = init([
    propsModule,
    classModule,
    styleModule,
    eventListenersModule,
    attributesModule,
    datasetModule,
]);

export class UIRenderInitOptions{
    public disconnPage?:boolean = false;
}

export class UIRenderer {
    private m_vnodePrev: VNode;
    private m_html: HTMLElement;

    private m_builder: UIBuilder;

    private static s_internalDiv:HTMLDivElement;

    public MessageEventCallback: (evt: UIEventData) => void;


    private static s_cssInited:boolean = false;

    private m_defienStyle:JQuery<HTMLStyleElement>;
    private m_defineScript:JQuery<HTMLScriptElement>;


    private m_options:UIRenderInitOptions;
    private m_onConn:boolean = false;

    private m_disconnFrameData:UIFrameData;

    private static initCSS(){
        if(UIRenderer.s_cssInited) return;
        UIRenderer.s_cssInited = true;
        $("<style>")
        .prop("type", "text/css")
        .html(INTERNAL_CSS)
        .appendTo("head");
    }

    public constructor(html: HTMLElement,options?:UIRenderInitOptions) {

        this.m_options = options || new UIRenderInitOptions();
        UIRenderer.initCSS();
        this.m_defienStyle = <JQuery<HTMLStyleElement>>$("<style>").prop("type", "text/css");
        this.m_defineScript = <JQuery<HTMLScriptElement>>$("<script>").prop("type","text/javascript");

        this.m_defienStyle.appendTo("head");
        this.m_defineScript.appendTo("head");

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
    
    public onConnectionLost(){
        this.m_onConn = false;
        let builder = this.m_builder;
        builder.beginChildren();

        let framedata = this.m_disconnFrameData;
        if(framedata!=null){
            var drawcmd = framedata.draw_commands;
            drawcmd.forEach(draw => {
                var parameters = draw.parameters;
                let method = `cmd${UIDrawCmdType[draw.cmd]}`;
                builder[method](parameters);
            });
        }

        builder.endChildren();
        this.m_vnodePrev = patchConfig(this.m_vnodePrev, builder.rootNode);
        builder.resetRootNode();
    }

    public setDisconnPage(data:UIFrameData){
        this.m_disconnFrameData = data;
    }

    public onUIAction(data:UIActionData){
        let builder = this.m_builder;
        var method = `action${UIActionType[data.action]}`;
        builder[method](data.id,data.data);
    }

    public onUIDefine(data:UIDefineData[]){
        this.m_builder.defineUpdate(data,this.m_defienStyle,this.m_defineScript);
    }

    public onUIEval(data:UIEvalData):Promise<UIEvalRetData>{
        if(data == null) return null;
        var code =data.code;
        if(code == null || code == "")return null;
        var result= eval(code);
        if(data.ret){
            return new Promise(res=>{
                res(new UIEvalRetData(data.id,result));
            });
        }
        return null;
    }

    public onUIFrame(data: UIFrameData) {
        this.m_onConn = true;

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
        let root = UIRenderer.s_internalDiv;

        let toastroot = `<div id="entangui-toastroot" aria-live="polite" aria-atomic="true"></div>`;
        root.appendChild(UIRenderer.buildDom(toastroot));
        

        let modalroot = `<div id="entangui-modalroot"></div>`
        root.appendChild(UIRenderer.buildDom(modalroot));
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
