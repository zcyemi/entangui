import { UIFrameData } from "./UIProtocol";
import { UIContext } from "./UIContext";

export abstract class UIContainer extends UIContext{

    private m_isdirty:boolean = false;

    public get isDirty():boolean{
        return this.m_isdirty;
    }

    protected abstract OnGUI();

    public constructor(){
        super();
    }

    public update():UIFrameData{
        this.m_isdirty =false;
        this.beginFrame();
        this.OnGUI();
        return this.endFrame();
    }

    public setDirty(){
        this.m_isdirty = true;
    }

}