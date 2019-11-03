import { h, init } from 'snabbdom';
import classModule from 'snabbdom/modules/class';
import eventListenersModule from 'snabbdom/modules/eventlisteners';
import propsModule from 'snabbdom/modules/props';
import styleModule from 'snabbdom/modules/style';
import { VNode } from 'snabbdom/vnode';
import { UIEventData, UIDrawCmdType } from './UIProtocol';

import $ from "jquery";

var patchConfig = init([
    propsModule,
    classModule,
    styleModule,
    eventListenersModule,
]);

export class UIBuilder {

    private m_rootNode: VNode;

    public get rootNode(): VNode { return this.m_rootNode; }

    private m_parentNodeStack: VNode[] = [];
    private m_childrenNodeStack: (VNode | string)[][] = [];

    private curNode: VNode;
    private curPnode: VNode;

    private curChidrenList: (VNode | string)[];

    private m_evtCallback:(evtdata:UIEventData)=>void;
    
    

    private m_paramCache:Map<string,any> = new Map();


    public constructor(eventCallback:(evtdata:UIEventData)=>void) {
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

    public cmdBeginGroup(options: any) {
        let padding = options.padding || "3px";
        let wrap = h('div', {
            style: {
                padding: padding
            }
        });
        this.pushNode(wrap);
        this.beginChildren();
    }

    public cmdEndGroup() {
        this.endChildren();
    }

    public cmdInput(options: any){
        let label = options['label'];
        let text = options['text'];
        let id = options['id'];
        let finish = options['finish'];

        var onEvents = null;
        if(finish){
            onEvents = {};
            onEvents['focusout'] = this.wrapEventDelay(id,'finish',()=>{
                var val = $(`#${id}`).val();
                return val;
            });
        }


        var prepend = label != null? h('div',{
            class:{
                'input-group-prepend':true
            }
        },[
            h('span',{
                class:{
                    'input-group-text':true,
                }
            },label)
        ]):null;

        let input = h('div',{
            class:{
                'input-group':true,
                'mb-3':true,
            }
        },[
            prepend
            ,
            h('input',{
                class:{'form-control':true},
                props:{
                    type:'text',
                    placeholder:label,
                    value:text,
                    id:id
                },
                on:onEvents
            })
        ]);

        this.pushNode(input);
    }

    private wrapEvent(id:string,event:string,data?:any):(p:any)=>void{
        var evt = new UIEventData();
        evt.id = id;
        evt.evt = event;
        evt.data = data;
        return ()=>{this.emiEvent(evt)}
    }


    private wrapEventDelay(id:string,event:string,datafunc:()=>any):(p:any)=>void{
        return ()=>{
            var dataf = datafunc;
            var evt = new UIEventData();
            evt.id = id;
            evt.evt = event;
            evt.data = dataf();
            this.emiEvent(evt)
        }
    }

    private emiEvent(evt:UIEventData){
        if(this.m_evtCallback!=null){
            this.m_evtCallback(evt);
        }
    }

    public cmdText(options:any){
        let tag = options['tag'] || 'p';
        let text = h(tag,{}, options['text']);
        this.pushNode(text);
    }

    public cmdBandage(options:any){
        let bandage = h('span', {
            class: {
                'badge': true,
                'badge-secondary': true
            }
        }, options['text']);
        this.pushNode(bandage);
    }

    public cmdButton(options: any) {

        var listeners:any = {};
        if(options.click){
            listeners.click = this.wrapEvent(options.id,'click');
        }

        let btn = h('button',
            {
                class: {
                    'btn': true,
                    'btn-primary': true
                },
                on:listeners,
                style:{
                    margin:'3px'
                }
            });
        btn.text = options.text;
        this.pushNode(btn);
    }

    public cmdAlert(options: any) {
        let alert = h('div', {
            class: {
                'alert': true,
                'alert-primary': true
            },
            attrs: {
                role: 'alert'
            }
        }, options['text']);
        this.pushNode(alert);
    }
    public cmdSidebarBegin(options:any){


        let id = options['id'];
        this.m_paramCache.set('sidebar',id);

        let nav = h('nav',{
            class:{
                'sidebar':true,
                'bg-light':true,
                'border-right':true,
                'sidebar-list':true,
            },
            id:id
        })
        this.pushNode(nav);
        this.beginChildren();

        let header= h('div',{
            class:{
                'sidebar-header':true
            }
        },options['text']);
        this.pushNode(header);

        let list = h('div',{
            class:{
                'list-group':true,
                'list-group-flush':true
            }
        });

        this.pushNode(list);
        this.beginChildren();
    }
    public cmdSidebarEnd(){
        this.endChildren();
        this.endChildren();
    }
    public cmdSidebarItem(options:any){

        let id = this.m_paramCache.get('sidebar');
        let key = options['key'];
        let item = h('a',{
            class:{
                'list-group-item':true,
                'list-group-item-action':true,
                'bg-light':true
            },
            attrs:{
                'href':'#'
            },
            on:{
                click: this.wrapEvent(id,'click',key)
            }
        },options['text']);
        this.pushNode(item);
    }

    public cmdFlexBegin(options:any){
        let flex = h('div',{
            class:{
                'd-flex':true
            }
        });
        this.pushNode(flex);
        this.beginChildren();
    }

    public cmdFlexItemBegin(options:any){
        var width = options.width;
        var flex = options.flex;

        var style = {};
        if(width){
            style['width'] = width;
        }
        if(flex){
            style['flex'] = flex;
        }
        let div = h('div',{
            style:style
        });
        this.pushNode(div);
        this.beginChildren();
    }

    public cmdFlexItemEnd(){
        this.endChildren();
    }

    public cmdFlexEnd(){
        this.endChildren();
    }

    public cmdDivider(){
        let hr = h('hr');
        this.pushChildren(hr);
    }
}