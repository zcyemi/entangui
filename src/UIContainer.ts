import { UIContext, UIFrameData } from "./UIProtocol";

export abstract class UIContainer{
    private m_ctx:UIContext;

    public get context():UIContext{ return this.m_ctx;}

    public constructor(){
        this.m_ctx = new UIContext();
    }
    protected abstract onGUI(builder:UIContext);

    public update():UIFrameData{
        let builder= this.m_ctx;
        builder.beginFrame();
        this.onGUI(builder);
        return builder.endFrame();
    }


}