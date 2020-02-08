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

    private m_rootContext:UIDomContext;

    private m_subContexts:Map<string,UIDomContext> = new Map();

    public constructor(rootNode:HTMLElement){

        this.m_rootContext = new UIDomContext('_root_',toVNode(rootNode));

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

        uibuilder.beginFrame(this.m_rootContext);

        let subcontxts = this.m_subContexts;
        subcontxts.forEach(ctx=>{
            this.transferContext(ctx);
        });
    }

    public endFrame(uibuilder:UIBaseBuilder){

        uibuilder.endFrame(this.m_rootContext);
    }

    public applyContext(ctx:UIDomContext){

    }

    public transferContext(ctx:UIDomContext){
        let ctxid = ctx.ctxid;
        let ctxObj = $(`#${ctxid}`).children().get(0);
        this.m_contextRoot.appendChild(ctxObj);
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

    public beginContextChange(){
        let node = h("div",{
            props:{
                id:'entangui-root'
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