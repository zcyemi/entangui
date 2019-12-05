import { h } from 'snabbdom';
import { VNode } from 'snabbdom/vnode';
import { UIEventData } from './UIProtocol';

export class UIBuilder {

    private m_rootNode: VNode;

    private m_internalDiv: HTMLDivElement;

    public get rootNode(): VNode { return this.m_rootNode; }

    private m_parentNodeStack: VNode[] = [];
    private m_childrenNodeStack: (VNode | string)[][] = [];

    private curNode: VNode;
    private curPnode: VNode;

    private curChidrenList: (VNode | string)[];

    private m_evtCallback: (evtdata: UIEventData) => void;
    private m_paramCache: Map<string, any> = new Map();


    public constructor(eventCallback: (evtdata: UIEventData) => void, internalDiv?: HTMLDivElement) {
        
        this.m_internalDiv = internalDiv;
        if (internalDiv != null) {
        }

        this.m_evtCallback = eventCallback;
        this.resetRootNode();
    }

    public resetRootNode() {
        let node = h("div");
        this.m_rootNode = node;
        this.curNode = node;
    }

    public pushNode(n: VNode) {
        this.curNode = n;
        this.pushChildren(n);
    }

    private pushChildren(c: VNode) {
        this.curChidrenList.push(c);
    }

    public beginChildren() {
        let pnode = this.curPnode;
        if (pnode != null) {
            this.m_parentNodeStack.push(pnode);
            this.m_childrenNodeStack.push(this.curChidrenList);
        }

        let curnode = this.curNode;

        curnode.children = [];
        this.curChidrenList = curnode.children;
        this.curPnode = this.curNode;
    }

    public endChildren() {

        this.curPnode.children = this.curChidrenList;
        this.curNode = this.curPnode;
        this.curPnode = this.m_parentNodeStack.pop();
        this.curChidrenList = this.m_childrenNodeStack.pop();

    }

    private mergeObject(tar: any, src: any) {
        if (src == null) return tar;
        return Object.assign(tar, src);
    }

    private buildClasses(...cls: string[]) {
        let ret = {};
        cls.forEach(c => {
            ret[c] = true
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

        $("#entangui-modalroot").append(`
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

    //widgets

    public cmdBeginGroup(options?: any) {
        let padding = "3px";
        if (options && options.padding) {
            padding = options.padding;
        }
        let wrap = h('div', {
            style: {
                padding: padding,
                width: '100%'
            },
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

    private wrapEvent(id: string, event: string, data?: any): (p: any) => void {
        var evt = new UIEventData();
        evt.id = id;
        evt.evt = event;
        evt.data = data;
        return () => { this.emitEvent(evt); }
    }


    private wrapEventDelay(id: string, event: string, datafunc: (val?:any) => any): (p: any) => void {
        return (val) => {
            var dataf = datafunc;
            var evt = new UIEventData();
            evt.id = id;
            evt.evt = event;
            evt.data = dataf(val);
            this.emitEvent(evt)
        }
    }

    private emitEvent(evt: UIEventData) {
        if (this.m_evtCallback != null) {
            this.m_evtCallback(evt);
        }
    }

    public cmdText(options: any) {
        let tag = options['tag'] || 'p';
        let text = h(tag, {}, options['text']);
        this.pushNode(text);
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
            listeners.click = this.wrapEvent(options.id, 'click');
        }

        let classes = this.buildClasses('btn',...options.class);

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
    public cmdElement(options:any){
        let tag = options.tag;
        let text =options.text;
        if(tag == null) return;

        let el = h(tag,{
            class: this.buildClasses(...options.class),
            style: options.style
        },text);
        this.pushNode(el);
    }

    public cmdBeginChildren(){
        this.beginChildren();
    }
    public cmdEndChildren(){
        this.endChildren();
    }

    public cmdAlert(options: any) {
        let theme = options['theme'] || 'primary';
        let alertCls = this.buildClasses('alert',`alert-${theme}`,...options.class);
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
            }
        });
        this.pushNode(flex);
        this.beginChildren();
    }

    public cmdFlexItemBegin(options: any) {
        var width = options.width;
        var flex = options.flex;


        var style = {};
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
        let card = h('div', {
            class: {
                'card': true,
            },
            style: {
                'margin': '3px'
            }
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

    public cmdFormBegin(options:any){
        let form = h('form');
        this.pushNode(form);
        this.beginChildren();
    }

    public cmdFormEnd(){
        this.endChildren();
    }

    public cmdFormInput(options:any){
        let label = options.label;
        let id = options.id;
        let type = options.type || 'text';
        let finish = options.finish;
        let text = options.text;

        this.formGroupBegin(label,id);
        {

            let onEvents = finish? {
                focusout: this.wrapEventDelay(id, 'finish', () => {
                    var val = $(`#${id}`).val();
                    return val;
                })
            }:null;

            let input = h('input',{
                props:{
                    type:type,
                    id:id,
                    placeholder: label,
                    value:text
                },
                class:this.buildClasses('form-control'),
                on: onEvents
            });
            this.pushNode(input);
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
                id:id
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
                            }
                        },val))
                    }
                }
            }
        }
        this.endChildren();

        this.formGroupEnd();

    }

    private formGroupBegin(label?:string,id?:string){
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

    private formGroupEnd(){
        this.endChildren();
    }


}