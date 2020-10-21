import { h } from 'snabbdom';
import toVNode from 'snabbdom/tovnode';
import { VNode } from 'snabbdom/vnode';
import { UIDomElement } from './UIFactory';
import { UIDefineData, UIDefineType, UIDrawCmd, UIDrawCmdType, UIEventData, UIFrameData } from './UIProtocol';
import { UIFeature } from './UIRender';
import { UIDomContext, UIVirtualDom } from './UIVirtualDom';


type CmdFunc = (option?:any)=>void;
type ActionFunc = (id: string, options: any)=>void;

export class UIBaseBuilder {
    protected m_rootNode: VNode;
    protected m_internalDiv: HTMLDivElement;
    public get rootNode(): VNode { return this.m_rootNode; }

    public feature_set:UIFeature[];

    protected m_evtCallback: (evtdata: UIEventData) => void;
    protected m_paramCache: Map<string, any> = new Map();

    protected m_defineStyle:{[key:string]:any} = {};
    protected m_defineScript:{[key:string]:any} = {};

    protected m_cmdList:{[cmd:string]:CmdFunc} = {};
    protected m_actList:{[act:string]:ActionFunc} = {};

    private m_currentDomCtx:UIDomContext;
    private m_virtualDom:UIVirtualDom;

    public registerCmd(name:UIDrawCmdType,func:CmdFunc){
        this.m_cmdList[UIDrawCmdType[name]] = func;
    }

    public registerAction(name:string,func:ActionFunc){
        this.m_actList[name] = func;
    }

    public constructor(eventCallback: (evtdata: UIEventData) => void, virtualDom:UIVirtualDom) {
        this.m_internalDiv = virtualDom.internalDiv;
        this.m_virtualDom = virtualDom;

        this.onRegisterFunctions();

        this.m_evtCallback = eventCallback;
        // this.resetRootNode();

        this.m_modalRoot = $('div#entangui-modalroot');
    }

    protected isFeatureEnable(feature:UIFeature):boolean{
        const featureset = this.feature_set;
        if(featureset == null || featureset.length == 0) return false;
        return featureset.includes(feature);
    }

    public beginFrame(domctx:UIDomContext){
        domctx.beginContextChange();
        this.m_currentDomCtx = domctx;
    }

    public endFrame(domctx:UIDomContext){
        if(domctx!=this.m_currentDomCtx){
            throw new Error('dom context inconsistant');
        }

        this.m_currentDomCtx.applyContextChange();
    }

    public execFrameData(data:UIFrameData){

        this.beginChildren();

        var drawcmd = data.draw_commands;
        drawcmd.forEach(draw => {
            var parameters = draw.parameters;
            if(parameters == null) parameters = {};
            let method = `cmd${UIDrawCmdType[draw.cmd]}`;
            this[method](parameters);
        });

        this.endChildren();
    }

    public execCmd(draw: UIDrawCmd) {
        var parameters = draw.parameters;
        let f = this.m_cmdList[UIDrawCmdType[draw.cmd]];
        if(f == null){
            console.log('method not register',UIDrawCmdType[draw.cmd]);
            return;
        }
        else{
            f(parameters);
        }
    }


    public cmdContextBegin(option:any){
        let ctxid = option.id;

        let theme = option.theme;

        let isMask = theme =='mask';

        this.pushNode(h('div',{
            class:{
                overlay:theme == 'overlay',
                mask:isMask,
            },
            style:option.style,
            props:{
                id: `poster-${ctxid}`
            }
        }));

        this.m_currentDomCtx = this.m_virtualDom.enterContext(ctxid,{maxsize:isMask});
    }

    public cmdContextEnd(option:any){
        let ctxid = option.id;
        this.m_currentDomCtx = this.m_virtualDom.leaveContext(this.m_currentDomCtx);
    }

    public defineUpdate(data:UIDefineData[],definecss:JQuery<HTMLStyleElement>,definejs:JQuery<HTMLScriptElement>){
        let scriptDirty =false;
        let styleDirty = false;

        data.forEach(d=>{
            switch(d.type){
                case UIDefineType.style:
                    {
                        styleDirty = true;
                        this.m_defineStyle[d.key] = d.value;
                    }
                break;
                case UIDefineType.script:
                    {
                        scriptDirty = true;
                        this.m_defineScript[d.key] = d.value;
                    }
                break;
            }
        });

        if(styleDirty){
            let csspart:string[] = [];
            const defienstyles = this.m_defineStyle;
            for (const key in defienstyles) {
                if (defienstyles.hasOwnProperty(key)) {
                    const styledef:UIDefineData = defienstyles[key];
                    let stylestr:string[] = [];
                    for (const csskey in styledef) {
                        if (styledef.hasOwnProperty(csskey)) {
                            const cassval = styledef[csskey];
                            stylestr.push(`${csskey}: ${cassval};`);
                        }
                    }

                    csspart.push(`${key}{
                        ${stylestr.join("\n")}
                    }`);
                }
            }

            var finalcss = csspart.join("\n");
            definecss.html(finalcss);
        }

        if(scriptDirty){
            let codeary:string[] = [];
            const definescripts = this.m_defineScript;
            for (const key in definescripts) {
                if (definescripts.hasOwnProperty(key)) {
                    const element = definescripts[key];
                    codeary.push(element);
                }
            }
            var finaljs = codeary.join("\n");
            definejs.html(finaljs);
        }
    }

    public pushNode(n: string | VNode) {

        this.m_currentDomCtx.pushNode(n);
    }

    private pushChildren(c: string| VNode) {
        this.m_currentDomCtx.pushChildren(c);
    }

    public beginChildren() {

        this.m_currentDomCtx.beginChildren();
       
    }

    public endChildren() {
        this.m_currentDomCtx.endChildren();
    }

    protected mergeObject(tar: any, src: any) {
        if (src == null) return tar;
        return Object.assign(tar, src);
    }

    protected buildClasses(...cls: string[]) {
        if(cls == null || cls == undefined) return null;
        let ret = {};
        cls.forEach(c => {
            if(c == null || c === '') return;
            ret[c] = true;
        });
        return ret;
    }
    
    //actions

    public actionToast(id: string, options: any) {
        let title = options.title;
        let msg = options.msg;

        $('#entangui-toastroot').append(`
            <div id="${id}" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="toast-header">
                    <strong class="mr-auto">${title}</strong>
                </div>
                <div class="toast-body">
                    ${msg}
                </div>
            </div>
        `);

        var toastObj: any = $(`#${id}`);

        console.log(toastObj);
        toastObj.on('hidden.bs.toast', () => {
            toastObj.remove();
        })
        toastObj.toast({
            delay: 2000
        });
        toastObj.toast('show');
    }

    public actionQuery(id:string,options:any){
    
        let title = options.title;
        let msg = options.msg;

        let text_confirm = options.text_confirm || "Confirm";
        let text_cancel = options.text_cancel || "Cancel";

        let id_title= `${id}_title`;

        let id_btn_ok = `${id}_btn_ok`;

        $(".entangui-modalroot").append(`
        <div class="modal fade" id="${id}" tabindex="-1" role="dialog" data-keyboard="false" data-backdrop="static" aria-labelledby="${id_title}" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="${id_title}">${title}</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close" click>
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    ${msg}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">${text_cancel}</button>
                    <button type="button" id="${id_btn_ok}" class="btn btn-primary">${text_confirm}</button>
                </div>
                </div>
            </div>
        </div>
        `);
        var resultSend = false;
        
        var modalobj: any = $(`#${id}`);
        $(`#${id_btn_ok}`).click(()=>{
            modalobj.modal('hide');
            if(!resultSend){
                this.wrapEvent(id,'result',true)(null);
            }
            resultSend = true;
        });
        modalobj.on('hidden.bs.modal', (e) => {
            modalobj.modal('dispose');
            modalobj.remove();
            if(!resultSend){
                this.wrapEvent(id,'result',false)(null);
            }
            resultSend =true;
        })
        modalobj.modal('show');
    }

    public actionNotify(id:string,options:any){
     
        let title = options.title;
        let msg = options.msg;

        let text_confirm = options.text_confirm || "OK";

        let id_title= `${id}_title`;

        let id_btn_ok = `${id}_btn_ok`;

        $(".entangui-modalroot").append(`
        <div class="modal fade" id="${id}" tabindex="-1" role="dialog" data-keyboard="false" data-backdrop="static" aria-labelledby="${id_title}" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered" role="document">
                <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="${id_title}">${title}</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close" click>
                    <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    ${msg}
                </div>
                <div class="modal-footer">
                    <button type="button" id="${id_btn_ok}" class="btn btn-primary" style="width:100%">${text_confirm}</button>
                </div>
                </div>
            </div>
        </div>
        `);
        var resultSend = false;
        
        var modalobj: any = $(`#${id}`);
        $(`#${id_btn_ok}`).click(()=>{
            modalobj.modal('hide');
            if(!resultSend){
                this.wrapEvent(id,'finish')(null);
            }
            resultSend = true;
        });
        modalobj.on('hidden.bs.modal', (e) => {
            modalobj.modal('dispose');
            modalobj.remove();
            if(!resultSend){
                this.wrapEvent(id,'finish')(null);
            }
            resultSend =true;
        })
        modalobj.modal('show');
    }

    //widgets

    public onRegisterFunctions(){
        this.registerCmd(UIDrawCmdType.BeginGroup,this.cmdBeginGroup);
        this.registerCmd(UIDrawCmdType.EndGroup,this.cmdEndGroup);

        this.registerCmd(UIDrawCmdType.Input,this.cmdInput);

        this.registerCmd(UIDrawCmdType.SidebarBegin,this.cmdSidebarBegin);
        this.registerCmd(UIDrawCmdType.SidebarEnd,this.cmdSidebarEnd);
        this.registerCmd(UIDrawCmdType.SidebarItem,this.cmdSidebarItem);


        this.registerCmd(UIDrawCmdType.FormInput,this.cmdFormInput);

        this.registerCmd(UIDrawCmdType.Input,this.cmdInput);

        this.registerCmd(UIDrawCmdType.BeginGroup,this.cmdBeginGroup);
        this.registerCmd(UIDrawCmdType.EndGroup,this.cmdEndGroup);
        this.registerCmd(UIDrawCmdType.FlexBegin,this.cmdFlexBegin);

        this.registerCmd(UIDrawCmdType.ButtonGroupBegin,this.cmdButtonGroupBegin);
        this.registerCmd(UIDrawCmdType.ButtonGroupEnd,this.cmdButtonGroupEnd);

        this.registerCmd(UIDrawCmdType.TabBegin,this.cmdTabBegin);
        this.registerCmd(UIDrawCmdType.TabEnd,this.cmdTabEnd);

    }

    public cmdBeginGroup(options?: any) {
        let padding = "3px";
        if (options && options.padding) {
            padding = options.padding;
        }
        let wrap = h('div', {
            style:this.mergeObject( {
                padding: padding,
                width: '100%'
            },options.style),
            class: options && options.classes
        });
        this.pushNode(wrap);
        this.beginChildren();
    }

    public cmdEndGroup() {
        this.endChildren();
    }

    public cmdInput(options: any) {
        let label = options['label'];
        let text = options['text'];
        let id = options['id'];
        let finish = options['finish'];

        let btn = options['btn'];
        let click = options['click'];

        let hasBtn = btn != null && click!=null;

        var onEvents = null;
        if (finish) {
            onEvents = {};
            onEvents['focusout'] = this.wrapEventDelay(id, 'finish', () => {
                var val = $(`#${id}`).val();
                return val;
            });
        }

        var prepend = label != null ? h('div', {
            class: {
                'input-group-prepend': true
            }
        }, [
            h('span', {
                class: {
                    'input-group-text': true,
                }
            }, label)
        ]) : null;


        let append:any = null;
        if(hasBtn){
            let btnListener:any = {};
            let btnid = `${id}-btn`;
            if(click){
                btnListener.click = this.wrapEvent(btnid,'click');
            }

            append = h('div',{
                class:this.buildClasses('input-group-append')
            },[
                h('button',{
                    class:this.buildClasses('btn','btn-outline-secondary'),
                    props: {
                        type: 'text',
                        id: id+"-btn",
                    },
                    on:btnListener
                },btn)
            ]);
        }

        let input = h('div', {
            class: {
                'input-group': true,
                'mb-3': true,
            }
        }, [
            prepend
            ,
            h('input', {
                class: { 'form-control': true },
                props: {
                    type: 'text',
                    placeholder: label,
                    value: text,
                    id: id
                },
                on: onEvents
            }),
            append
        ]);

        this.pushNode(input);
    }

    protected wrapEvent(id: string, event: string, data?: any): (p: any) => void {
        var evt = new UIEventData();
        evt.id = id;
        evt.evt = event;
        evt.data = data;
        return () => { this.emitEvent(evt); }
    }


    protected wrapEventDelay(id: string, event: string, datafunc: (val?:any) => any): (p: any) => void {
        return (val) => {
            var dataf = datafunc;
            var evt = new UIEventData();
            evt.id = id;
            evt.evt = event;
            evt.data = dataf(val);
            this.emitEvent(evt)
        }
    }

    private buildEventListener(id:string,on:{[key:string]:string}):any{
        let ret = {};
        for (const key in on) {
            if (on.hasOwnProperty(key)) {
                const value = on[key];
                ret[key] = this.wrapEvent(id,key,value);
            }
        }
        return ret;
    }

    private emitEvent(evt: UIEventData) {
        if (this.m_evtCallback != null) {
            this.m_evtCallback(evt);
        }
    }

    public cmdText(options: any) {
        options = options || {};
        let tag = options['tag'] || 'p';
        let text = h(tag, {
            class:{},
            props:options.props,
            style:options.style,
        }, options['text']);
        this.pushNode(text);
    }

    public cmdIcon(options:any){
        let icon = h('i',{
            class:this.buildClasses('fa',`fa-${options.icon}`,"fa-large")
        });
        this.pushNode(icon);
    }

    public cmdBandage(options: any) {
        let bandage = h('span', {
            class: {
                'badge': true,
                'badge-secondary': true
            }
        }, options['text']);
        this.pushNode(bandage);
    }

    public cmdButton(options: any) {
        var listeners: any = {};

        if (options.click) {
            listeners.click = this.wrapEvent(options.id, 'click',this.m_curFormId);
        }

        let rawclasses = options.class || [];
        let theme = options.theme;
        if(theme!=null){
            if(theme != 'none'){
                rawclasses.push(`btn-${theme}`);
            }
        }
        else{
            rawclasses.push('btn-primary');
        }
        let classes = this.buildClasses('btn',...(rawclasses || []));
        let btn = h('button',
            {
                class: classes,
                on: listeners,
                props:{type:'button'},
                style:this.mergeObject({
                    margin: '3px'
                },options.style)
            });
        btn.text = options.text;
        this.pushNode(btn);
    }


    public cmdElement(options:any){
        let tag = options.tag;
        let text =options.text;
        if(tag == null) return;

        let edata = {
            class: this.buildClasses(...(options.class || [])),
            style: options.style,
        };

        if(options){

            let props = options.props;
            if(props){
                edata['props'] = props;
            }
            else{
                edata['props'] = {};
            }

            let id = options.id;
            if(id){
                edata['props'].id = id;
                
                let on = options.on;
                if(on){
                    edata['on'] = this.buildEventListener(id,on);
                }
            }
            let attrs = options.attrs;
            if(attrs){
                edata['attrs'] = attrs;
            }
        }

        let el = h(tag,edata,text);
        this.pushNode(el);
    }

    public cmdBeginChildren(){
        this.beginChildren();
    }
    public cmdEndChildren(){
        this.endChildren();
    }


    public cmdButtonGroupBegin(option:any){}
    public cmdButtonGroupEnd(option:any){}

    public cmdJSX(option:any){
        let dom:UIDomElement = option.dom;
        this.pushUIDomElement(dom,option);
    }

    private pushUIDomElement(dom:UIDomElement,option:any = null){
        if(dom == null) return;

        const element = document.createElement(dom.tag);
        const attributes = dom.attrs;
        if(attributes){
            for (const key of Object.keys(attributes)) {
                const attributeValue = attributes[key];

                if (key === "className") { // JSX does not allow class as a valid name
                    element.setAttribute("class", attributeValue);
                } else if (key.startsWith("on") && typeof attributes[key] === "function") {
                    element.addEventListener(key.substring(2), attributeValue);
                } else {
                    // <input disable />      { disable: true }
                    // <input type="text" />  { type: "text"}
                    if (typeof attributeValue === "boolean" && attributeValue) {
                        element.setAttribute(key, "");
                    } else {
                        element.setAttribute(key, attributeValue);
                    }
                }
            }
        }

        if(dom.text!=null){
            element.innerText = dom.text;
        }

        let vnode = toVNode(element);
        if(option!=null){
            let id = element.id;
            if(id == null || id == ''){
                id = option.id;
                if(id !=null){
                    let vprops = vnode.data.props;
                    if(vprops == null){
                        vnode.data.props = {id: id};
                    }else{
                        vprops.id = id;
                    }
                }
            }
            
            if(id){
                let on = option.on;
                if(on){
                    vnode.data.on = this.buildEventListener(id,on);
                }
            }
        }

        this.pushNode(vnode);
        let children = dom.children;
        if(children !=null && children.length > 0){
            this.beginChildren();
            children.forEach(c=>{
                if(c instanceof UIDomElement){
                    this.pushUIDomElement(c);
                }else if(typeof c === 'string'){
                    this.pushNode(<VNode>{text:c});
                }
                else if(c instanceof UIDrawCmd){
                    this.execCmd(c);
                }
            })
            this.endChildren()
        }

    }

    public cmdHTML(option?:any){
        let nodes =$.parseHTML(option.html);
        if(nodes == null || nodes.length == 0)return;
        let domnode = nodes[0];
        let vnode = toVNode(domnode);


        let vdata = vnode.data;

        if(option){
            let props = option.props;
            if(props){
                vdata.props = this.mergeObject(vdata.props || {},props);
            }
            else{
                vdata.props = {};
            }

            let id = vdata.props.id;
            if(!id){
                id = option.id;
                vdata.props.id = id;
            }
            if(id){
                let on = option.on;
                if(on){
                    vdata.on = this.buildEventListener(id,on);
                }
            }

        }

        vdata.style = this.mergeObject(vdata.style || {},option.style);
        if(vnode == null) return;
        this.pushNode(vnode);
    }

    public cmdAlert(options: any) {
        let theme = options['theme'] || 'primary';
        let alertCls = this.buildClasses('alert',`alert-${theme}`,...(options.class || []));
        let alert = h('div', {
            class:alertCls,
            attrs: {
                role: 'alert'
            }
        }, options['text']);
        this.pushNode(alert);
    }
    public cmdSidebarBegin(options: any) {

        let id = options['id'];
        this.m_paramCache.set('sidebar', id);

        let nav = h('nav', {
            class: {
                'sidebar': true,
                'bg-light': true,
                'border-right': true,
                'sidebar-list': true,
            },
            id: id,
            style:{
                height: '100vh'
            }
        })
        this.pushNode(nav);
        this.beginChildren();

        let header = h('div', {
            class: {
                'sidebar-header': true
            }
        }, options['text']);
        this.pushNode(header);

        let list = h('div', {
            class: {
                'list-group': true,
                'list-group-flush': true
            }
        });

        this.pushNode(list);
        this.beginChildren();
    }
    public cmdSidebarEnd() {
        this.endChildren();
        this.endChildren();
    }
    public cmdSidebarItem(options: any) {

        let id = this.m_paramCache.get('sidebar');
        let key = options['key'];
        let item = h('a', {
            class: {
                'list-group-item': true,
                'list-group-item-action': true,
                'bg-light': true
            },
            attrs: {
                'href': '#'
            },
            on: {
                click: this.wrapEvent(id, 'click', key)
            }
        }, options['text']);
        this.pushNode(item);
    }

    public cmdFlexBegin(options: any) {
        let flex = h('div', {
            class: {
                'd-flex': true
            },
            style:options.style
        });
        this.pushNode(flex);
        this.beginChildren();
    }

    public cmdFlexItemBegin(options: any) {
        var width = options.width;
        var flex = options.flex;


        var style = options.style || {};
        if (width) {
            style['width'] = width;
        }
        if (flex) {
            style['flex'] = flex;
        }
        let div = h('div', {
            style: style
        });
        this.pushNode(div);
        this.beginChildren();
    }

    public cmdFlexItemEnd() {
        this.endChildren();
    }

    public cmdFlexEnd() {
        this.endChildren();
    }

    public cmdDivider() {
        let hr = h('hr');
        this.pushChildren(hr);
    }

    public cmdCardBegin(options: any) {
        let classes = this.buildClasses(...(options.class || []),'card');
        let card = h('div', {
            class: classes,
            style: options.style
        });
        this.pushNode(card);
        this.beginChildren();

        var title = options['title'];
        if (title) {
            let cardheader = h('div', {
                class: { 'card-header': true }
            }, title);
            this.pushNode(cardheader);
        }

        this.pushNode(h('div', { class: { 'card-body': true } }));
        this.beginChildren();
    }

    public cmdCardEnd() {
        this.endChildren();
        this.endChildren();
    }

    public cmdListBegin(options: any) {
        let classes = {
            'list-group': true
        };
        if (options['flush']) {
            classes['list-group-flush'] = true;
        }

        let list = h('div', {
            class: classes
        });

        this.pushNode(list);
        this.beginChildren();

        let item = h('div', {
            class: {
                'list-group-item': true
            }
        });
        this.pushNode(item);
        this.beginChildren();
    }
    public cmdListItemNext() {
        this.endChildren();
        let item = h('div', {
            class: {
                'list-group-item': true
            }
        });
        this.pushNode(item);
        this.beginChildren();
    }
    public cmdListEnd() {
        this.endChildren();
        this.endChildren();
    }

    public cmdTreeBegin(options:any){
        let label = options.label;
    }

    public cmdTreeEnd(){

    }

    public cmdTabBegin(options: any) {
        let id = options.id;
        let tabs: string[] = options.tabs;

        if (tabs == null) return;

        this.cmdBeginGroup();

        let ul = h('ul', {
            class: this.buildClasses("nav", 'nav-pills', 'nav-fill'),
            props: { id: id, role: 'tablist' },
        }, []);
        this.pushNode(ul);
        this.beginChildren();
        tabs.forEach((tabname, t) => {
            var itemid = `${id}-${t}`;
            var funcClick = this.wrapEventDelay(id, 'click', () => {
                return t;
            });
            let li = h('li', { class: this.buildClasses('nav-item') }, [
                h('a', {
                    class: t ==0 ? this.buildClasses('nav-link','active') : this.buildClasses('nav-link'),
                    props: {
                        id: itemid,
                        href: '#',
                        role: 'tab'
                    },
                    dataset: {
                        toggle: 'pill'
                    },
                    on: {
                        click: funcClick
                    }
                }, tabname)
            ]);
            ul.children.push(li);
        });
        this.endChildren();
    }

    public cmdTabEnd() {
        this.cmdEndGroup();
    }

    public cmdCollapseBegin(options:any){

        let style = this.mergeObject({
            'margin-top':'3px'
        },options.style);

        

        let id = options.id;
        let title = options.title;
        let btn = h('button',{
            class:this.buildClasses('btn','btn-block','btn-outline-primary'),
            dataset:{
                toggle:'collapse',
                target:`#${id}`,
            },
            props:{type:'button'},
            style:style
        },title);
        this.pushNode(btn);
        let div = h('div',{
            props:{
                id:id,
            },
            class:this.buildClasses('collapse')
        });
        this.pushNode(div);
        this.beginChildren();
    }

    public cmdCollapseEnd(){
        this.endChildren();
    }

    protected m_curFormId:string;

    public cmdFormBegin(options:any){

        let formid = options.id;
        let form = h('form',{
            props: this.mergeObject({id:formid},options.props)
        });

        this.m_curFormId= formid;

        this.pushNode(form);
        this.beginChildren();
    }

    public cmdFormEnd(){
        this.endChildren();

        this.m_curFormId=  null;
    }

    public cmdFormButton(options:any){
        var curFormId = this.m_curFormId;
        var listeners: any = {};
        if (options.click) {
            listeners.click = this.wrapEvent(options.id, 'click',curFormId);
        }

        let rawclasses = options.class || [];
        let theme = options.theme;
        if(theme!=null){
            if(theme != 'none'){
                rawclasses.push(`btn-${theme}`);
            }
            
        }
        else{
            rawclasses.push('btn-primary');
        }
        let classes = this.buildClasses('btn',...(rawclasses || []));
        let btn = h('button',
            {
                class: classes,
                on: listeners,
                style:this.mergeObject({
                    margin: '3px'
                },options.style)
            });
        btn.text = options.text;
        this.pushNode(btn);
    }

    public cmdFormNumber(options:any){}

    public cmdFormInput(options:any){
        let label = options.label;
        let id = options.id;
        let type = options.type || 'text';
        let finish = options.finish;
        let text = options.text;
        let name = options.name;

        let isDateTime = (type == 'datetime');
        if(isDateTime && !this.isFeatureEnable(UIFeature.datetime_picker)){
            isDateTime = false;
            type = "text";
        }
        this.formGroupBegin(label,id);
        {
            let onEvents = {};
            
            if(!isDateTime){
                onEvents['focusout'] = this.wrapEventDelay(id, 'finish', () => {
                    var val = $(`#${id}`).val();
                    return val;
                });
            }
            else{
                text = text || "2020/1/1 12:00";
            }

            let input = h('input',{
                props:{
                    type:type,
                    id:id,
                    placeholder: label,
                    value:text,
                    'autocomplete':'off',
                    name:name,
                },
                class:this.buildClasses('form-control'),
                on: onEvents
            });
            this.pushNode(input);

            if(isDateTime){
                setTimeout(()=>{
                    $(`#${id}`)['datetimepicker']({
                        format:'Y/m/d h:m',
                        onChangeDateTime:this.wrapEventDelay(id,"finish",()=>{
                            var val = $(`#${id}`).val();
                            return val;
                        })
                    });
                },100);
            }
        }
        this.formGroupEnd();
    }

    public cmdFormTextArea(options:any){
        let label = options.label;
        let id = options.id;
        let finish = options.finish;
        let text = options.text;
        let rows = options.rows || 3;

        this.formGroupBegin(label,id);
        {
            let onEvents = finish? {
                focusout: this.wrapEventDelay(id, 'finish', () => {
                    var val = $(`#${id}`).val();
                    return val;
                })
            }:null;

            let input = h('textarea',{
                props:{
                    id:id,
                    placeholder: label,
                    value:text,
                    rows:rows
                },
                class:this.buildClasses('form-control'),
                on: onEvents
            });
            this.pushNode(input);
        }
        this.formGroupEnd();
    }

    public cmdFormSelect(options:any){
        let items = options.items;
        let label = options.label;
        let id = options.id;
        let value = options.value;

        if(value == null){
            for (const key in items) {
                value = key;
                break;
            }
        }

        let onEvent = {};
        if(options.change){
            onEvent = {
                change: this.wrapEventDelay(id,'change',(evt)=>{
                    let tar = evt.target;
                    return tar.options[tar.selectedIndex].value;
                })
            }; 
        };
        
        this.formGroupBegin(label,id);

        let sel = h('select',{
            class:this.buildClasses('form-control'),
            props:{
                id:id,
            },
            on:onEvent
        });

        this.pushNode(sel);
        this.beginChildren();
        {
            if(items){
                for (const key in items) {
                    if (items.hasOwnProperty(key)) {
                        const val = items[key];

                        this.pushNode(h('option',{
                            props:{
                                value:key
                            },
                            attrs:{
                                selected: key == value
                            }
                        },val))
                    }
                }
            }
        }
        this.endChildren();

        this.formGroupEnd();

    }

    protected formGroupBegin(label?:string,id?:string){
        let group = h('div',{
            class:this.buildClasses('form-group')
        });
        this.pushNode(group);
        this.beginChildren();

        if(label){
            let labeldom = h('label',{
                props:{
                    for:id
                }
            },label);
            this.pushNode(labeldom);
        }
    }

    protected formGroupEnd(){
        this.endChildren();
    }

    protected m_modalRoot:JQuery<HTMLElement>;

    private m_modalShowCount= 0;

    protected modalRootShow(){
        if(this.m_modalShowCount == 0){
            this.m_modalRoot.animate({
                opacity:1,
            },500);
            this.m_modalRoot.css('display','block');
        }

        this.m_modalShowCount++;
    }

    protected modalRootHide(){

        if(this.m_modalShowCount == 1){
            this.m_modalRoot.animate({
                opacity:0,
            },500,null,()=>{
                this.m_modalRoot.css('display','none');
            });
        }
        this.m_modalShowCount--;
    }

}