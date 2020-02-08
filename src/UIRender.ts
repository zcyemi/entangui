import { h, init } from "snabbdom";
import classModule from 'snabbdom/modules/class';
import eventListenersModule from 'snabbdom/modules/eventlisteners';
import propsModule from 'snabbdom/modules/props';
import styleModule from 'snabbdom/modules/style';
import toVNode from "snabbdom/tovnode";
import vnode, { VNode } from "snabbdom/vnode";
import { UIBaseBuilder } from "./UIBuilder";
import { UIActionData, UIActionType, UIDrawCmdType, UIEventData, UIFrameData, UIDefineData, UIEvalData, UIEvalRetData, UIDrawCmd } from "./UIProtocol";
import attributesModule from "snabbdom/modules/attributes";
import datasetModule from "snabbdom/modules/dataset";
import { UIContainer } from "./UIContainer";
import { UIFrameBuilder } from "./UIFrameBuilder";
import { IUITheme } from "./UITheme";
import { UIThemeBootstrap } from "./UIThemeBootstrap";
import { UIThemeDefault } from "./UIThemeDefault";
import { UIVirtualDom } from "./UIVirtualDom";


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
    position: fixed;
    top: 50vh;
    right: 0px;
}
.toast{
    min-width: 250px;
}
`;

const patchConfig = init([
    propsModule,
    classModule,
    styleModule,
    eventListenersModule,
    attributesModule,
    datasetModule,
]);

export class UIRenderInitOptions{
    public disconnPage?:boolean = false;
    public theme?:IUITheme = new UIThemeDefault();

    public cdn_jquery_datetimepicker_js?:string = "https://cdn.bootcss.com/jquery-datetimepicker/2.5.20/jquery.datetimepicker.full.min.js";
    public cdn_jquery_datetimepicker_css?:string = "https://cdn.bootcss.com/jquery-datetimepicker/2.5.20/jquery.datetimepicker.min.css";
    public cdn_font_awesome_css?:string = "https://cdn.bootcss.com/font-awesome/4.7.0/css/font-awesome.min.css";
}

export class UIHTMLDepLoader{

    private static s_cssMap:Map<string,JQuery<HTMLElement>> = new Map();
    private static s_jsMap:Map<string,HTMLElement> = new Map();

    public static loadJs(url:string,esm:boolean =false){

        if(url == null || url === '') return;
        if(UIHTMLDepLoader.s_jsMap.has(url)) return;
        var element = document.createElement('script');
        element.type = esm ? "module" : "text/javascript";
        element.src = url;

        UIHTMLDepLoader.s_jsMap.set(url,element);
        document.getElementsByTagName('head')[0].appendChild(element);

    }

    public static loadCss(url:string){
        if(url == null || url === '') return;
        if(UIHTMLDepLoader.s_cssMap.has(url)) return;
        var element = $('<link>').prop('href',url).prop('rel','stylesheet');
        UIHTMLDepLoader.s_cssMap.set(url,element);
        element.appendTo('head');
    }

    public static addCSS(name:string,css:string){
        let style= $("<style>")
        .prop("type", "text/css")
        .html(css);
        style.appendTo("head");

        UIHTMLDepLoader.s_cssMap.set(name,style);
    }

    public static removeCSS(name:string){
        let style = UIHTMLDepLoader.s_cssMap.get(name);
        if(style!=null) style.remove();
    }
}

export class UIRenderer {
    private m_vnodePrev: VNode;
    private m_html: HTMLElement;

    private m_builder: UIBaseBuilder;

    public MessageEventCallback: (evt: UIEventData) => void;


    private static s_cssInited:boolean = false;

    private m_defienStyle:JQuery<HTMLStyleElement>;
    private m_defineScript:JQuery<HTMLScriptElement>;

    public static patchNodeFunc:(oldn:VNode,newn:VNode)=>VNode = patchConfig;

    private m_options:UIRenderInitOptions;
    private m_onConn:boolean = false;

    private m_disconnFrameData:UIFrameData;

    private m_virtualDom:UIVirtualDom;

    private static initDepResources(options:UIRenderInitOptions){
        if(UIRenderer.s_cssInited) return;
        UIRenderer.s_cssInited = true;
        UIHTMLDepLoader.loadCss(options.cdn_font_awesome_css);

        UIHTMLDepLoader.loadCss(options.cdn_jquery_datetimepicker_css);
        UIHTMLDepLoader.loadJs(options.cdn_jquery_datetimepicker_js);

        var theme = options.theme;
        theme.LoadDepStyleSheet();
        theme.LoadDepScript();

        UIHTMLDepLoader.addCSS('internal_css',INTERNAL_CSS);
    }

    public constructor(html: HTMLElement,options?:UIRenderInitOptions) {
        options = options || new UIRenderInitOptions();
        if(options.theme == null){
            options.theme = new UIThemeBootstrap();
        }
        this.m_options = options;

        UIRenderer.initDepResources(this.m_options);
        this.m_defienStyle = <JQuery<HTMLStyleElement>>$("<style>").prop("type", "text/css");
        this.m_defineScript = <JQuery<HTMLScriptElement>>$("<script>").prop("type","text/javascript");

        this.m_defienStyle.appendTo("head");
        this.m_defineScript.appendTo("head");

        this.m_virtualDom = new UIVirtualDom(html);

        this.m_html = html;
        this.m_vnodePrev = toVNode(html);


        this.m_builder = this.m_options.theme.GetUIBuilder(this.onMessageEvent.bind(this),this.m_virtualDom);
    }

    private onMessageEvent(evt: UIEventData) {
        let cb = this.MessageEventCallback;
        if (cb != null) {
            cb(evt);
        }
    }
    
    public onConnectionLost(){
        this.m_onConn = false;
        // const builder = this.m_builder;
        // builder.beginChildren();

        // let framedata = this.m_disconnFrameData;
        // if(framedata!=null){
        //     var drawcmd = framedata.draw_commands;
        //     drawcmd.forEach(draw => {
        //         builder.execCmd(draw)
        //     });
        // }

        // builder.endChildren();
        // this.m_vnodePrev = patchConfig(this.m_vnodePrev, builder.rootNode);
        // builder.resetRootNode();
    }

    public setDisconnPage(data:UIFrameData){
        this.m_disconnFrameData = data;
    }

    public onUIAction(data:UIActionData){
        let builder = this.m_builder;
        var method = `action${UIActionType[data.action]}`;

        console.log("on ui action");
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

        const builder = this.m_builder;
        const virtualDom = this.m_virtualDom;

        virtualDom.beginFrame(builder);
        builder.execFrameData(data);
        virtualDom.endFrame(builder);
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
        return $(xmlstr).get(0);
    }
    
}
