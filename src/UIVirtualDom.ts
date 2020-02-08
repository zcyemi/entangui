import { VNode } from "snabbdom/vnode";
import { UIRenderer } from "./UIRender";
import { UIBaseBuilder } from "./UIBuilder";
import { h } from "snabbdom";
import toVNode from "snabbdom/tovnode";


export class UIVirtualDom{

    private m_modalRoot:JQuery<HTMLElement>;
    private m_contextRoot:HTMLElement;
    public toastRoot:HTMLElement;
    public modalRoot:HTMLElement;

    public internalDiv:HTMLDivElement;

    private mainContext:UIDomContext;

    private m_subContexts:Map<string,UIDomContext> = new Map();
    private m_subContextStack:UIDomContext[] = [];
    private m_curContext:UIDomContext;

    public constructor(rootNode:HTMLElement){

        this.mainContext = new UIDomContext('_root_',toVNode(rootNode));
        this.m_curContext = this.mainContext;

        let internalDiv = <HTMLDivElement>document.getElementById('entangui-div');
        if(internalDiv == null){
            internalDiv =document.createElement('div');
            internalDiv.id = "entangui-div";
            document.body.appendChild(internalDiv);
        }
        this.internalDiv = internalDiv;

        //ToastRoot
        let toastRoot = document.getElementById('entangui-toastroot');
        if(toastRoot == null){
            toastRoot = internalDiv.appendChild(UIRenderer.buildDom(`<div id="entangui-toastroot" aria-live="polite" aria-atomic="true"></div>`));
        }
        this.toastRoot = toastRoot;

        //ModalRoot
        let modalRoot = document.getElementById('entangui-modalroot');
        if(modalRoot == null){
            modalRoot = internalDiv.appendChild(UIRenderer.buildDom(`<div id="entangui-modalroot"></div>`));
        }
        this.modalRoot = modalRoot;

        //CtxRoot
        let ctxRoot = document.getElementById('entangui-ctxroot');
        if(ctxRoot == null){
            ctxRoot = document.createElement('div');
            ctxRoot.id = 'entangui-ctxroot';
            this.internalDiv.appendChild(ctxRoot);
        }
        ctxRoot.style.display = 'none';
        this.m_contextRoot = ctxRoot;
    }

    public beginFrame(uibuilder:UIBaseBuilder){
        uibuilder.beginFrame(this.mainContext);

        this.m_subContexts.forEach(ctx=>this.transferDom(ctx));
    }

    public endFrame(uibuilder:UIBaseBuilder){

        uibuilder.endFrame(this.mainContext);

        //place context dom

        this.m_subContexts.forEach(ctx=>this.placeDom(ctx));
    }

    public transferContext(ctx:UIDomContext){
        let ctxid = ctx.ctxid;
        let ctxObj = $(`#${ctxid}`).children().get(0);
        this.m_contextRoot.appendChild(ctxObj);
    }

    private getContext(ctxid:string):UIDomContext{
        const subctxs = this.m_subContexts;
        if(subctxs.has(ctxid)){
            return subctxs.get(ctxid);
        }
        else{
            let slot:HTMLDivElement = document.createElement('div');
            slot.id = `ctx-${ctxid}`;
            this.m_contextRoot.appendChild(slot);

            let ctx = new UIDomContext(ctxid,toVNode(slot));
            subctxs.set(ctxid,ctx);
            return ctx;
        }
    }

    public enterContext(ctxid:string,options?:any):UIDomContext{

        this.m_subContextStack.push(this.m_curContext);
        let curctx = this.getContext(ctxid);
        this.m_curContext = curctx;

        curctx.beginContextChange(options);
        curctx.beginChildren();

        return curctx;
    }

    public leaveContext(uictx:UIDomContext):UIDomContext{
        if(uictx !=this.m_curContext) throw new Error('invalid context processing');
        uictx.endChildren();
        uictx.applyContextChange();
        this.m_curContext = this.m_subContextStack.pop();
        return this.m_curContext;
    }


    public placeDom(ctx:UIDomContext){
        const ctxid = ctx.ctxid;
        const postID = `poster-${ctxid}`;
        const domID = `ctx-${ctxid}`;

        let poster = document.getElementById(postID);
        if(poster == null) return;
        let dom = document.getElementById(domID);
        if(domID == null) return;
        poster.appendChild(dom);
    }

    public transferDom(ctx:UIDomContext){
        const ctxid = ctx.ctxid;
        const postID = `poster-${ctxid}`;
        const domID = `ctx-${ctxid}`;

        let poster = document.getElementById(postID);
        if(poster == null) return;
        let dom = document.getElementById(domID);
        if(domID == null) return;
        this.m_contextRoot.appendChild(dom);
    }

}

export class UIDomContext{

    protected m_parentNodeStack: VNode[] = [];
    protected m_childrenNodeStack: (VNode | string)[][] = [];


    public curWorkingNode:VNode;
    public realNode:VNode;

    public curNode:VNode;
    public curPnode:VNode;
    protected curChidrenList: (VNode | string)[];

    public ctxid:string;

    public constructor(ctxid:string,realNode:VNode){
        this.ctxid = ctxid;
        this.realNode = realNode;
        this.beginContextChange();
    }

    public beginContextChange(options?:any){

        let maxsize = options!=null && options.maxsize;
        let node = h("div",{
            class:{
                maxsize:maxsize
            },
            props:{
                id:`ctx-${this.ctxid}`
            }
        });
        this.curNode = node;
        this.curWorkingNode = node;
    }


    public applyContextChange(){
        this.realNode = UIRenderer.patchNodeFunc(this.realNode,this.curWorkingNode);
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


    public pushNode(n: string | VNode) {
        if(typeof n !== 'string'){
            this.curNode = n;
        }
        this.pushChildren(n);
    }

    public pushChildren(c: string| VNode) {
        this.curChidrenList.push(c);
    }




}