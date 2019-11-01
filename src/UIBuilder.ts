import { h, init } from 'snabbdom';
import classModule from 'snabbdom/modules/class';
import eventListenersModule from 'snabbdom/modules/eventlisteners';
import propsModule from 'snabbdom/modules/props';
import styleModule from 'snabbdom/modules/style';
import { VNode } from 'snabbdom/vnode';
import { UIEventData } from './UIProtocol';

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

    private wrapEvent(id:string,event:string):Function{
        var evt = new UIEventData();
        evt.id = id;
        evt.evt = event;
        return ()=>{this.emiEvent(evt)}
    }

    private emiEvent(evt:UIEventData){

        if(this.m_evtCallback!=null){
            this.m_evtCallback(evt);
        }
    }

    public cmdText(options:any){
        let text = h('span',{}, options['text']);
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
                on:listeners
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

}




// export abstract class UIContext{
//     private m_html:HTMLElement;
//     private m_originNode:VNode;
//     private m_vnodePrev:VNode;
//     private m_vnodeCur:VNode;

//     private get node():VNode{
//         return this.m_vnodeCur;
//     }

//     private builder:UIBuilder;


//     private m_trigUpdate:boolean = false;

//     constructor(){
//         this.builder=  new UIBuilder();
//         window.requestAnimationFrame(this.OnUpdate.bind(this));
//     }

//     abstract DrawUI();

//     private OnUpdate(){

//         if(this.m_trigUpdate){
//             this.m_trigUpdate = false;
//             this.update();
//         }

//         window.requestAnimationFrame(this.OnUpdate.bind(this));
//     }

//     private pushNode(v:VNode){this.builder.pushNode(v)}



//     private wrapEvent(f?:Action):()=>void{
//         if(f == null) return null;
//         var self = this;
//         return ()=>{
//             f(this);
//             self.trigUpdate();
//         }
//     }

//     private trigUpdate(){
//         this.m_trigUpdate =true;
//     }


//     public button(text:string,onclick?:Action){
//         let btn = h('button',
//         {
//             class:{
//                 'btn':true,
//                 'btn-primary':true
//             },
//             on:{
//                 click: this.wrapEvent(onclick),
//             }
//         });

//         btn.text = text;
//         this.builder.pushNode(btn);
//     }

//     public beginVertical(){

//         const builder =this.builder;
//         builder.pushNode(h('div'));
//         builder.beginChildren();
//     }

//     public endVertical(){

//         const builder = this.builder;
//         builder.endChildren();

//     }

//     // public toggle(text:string,value:boolean){}

//     public alert(text:string){

//         let alert=  h('div',{
//             class:{
//                 'alert':true,
//                 'alert-primary':true
//             },
//             attrs:{
//                 role:'alert'
//             }
//         },text);
//         this.builder.pushNode(alert);
//     }

//     // public label(text:string){};

//     // public seperator(){}

//     // public beginForm(){}

//     // public endForm(){}

//     // public inputEmail(lable:string){
//     // }


//     public beginForm(){
//         let root = h('form');
//         this.pushNode(root);
//         this.builder.beginChildren();


//     }


//     public formInput(label:string,id:string,value:string,helper?:string){
//         let item = h('div',{class:{'form-group':true}},[
//             h('label',{},label),
//             h('input',{
//                 class:{'form-control':true},
//                 attrs:{
//                     id:id
//                 },
//                 text:value
//             })
//         ]);
//         this.pushNode(item);
//     }

//     public endForm(){
//         this.builder.endChildren();
//     }


//     public beginGroup(padding:any = '3px'){
//         let wrap = h('div',{
//             style:{
//                 padding:padding
//             }
//         });

//         this.pushNode(wrap);
//         this.builder.beginChildren();
//     }


//     public endGroup(){
//         this.builder.endChildren();
//     }

//     public update(){
//         console.log("update ui");

//         this.builder.beginChildren();
//         this.DrawUI();
//         this.builder.endChildren();

//         this.m_vnodePrev = patchConfig(this.m_vnodePrev,this.builder.rootNode);
//         this.builder.resetRootNode();

//     }


//     public patch(html:HTMLElement|null){
//         if(html == null) return;

//         this.m_html = html;
//         this.m_originNode = toVNode(html);
//         this.m_vnodePrev = toVNode(html);
//     }


// }