import { UIFrameDataBuilder } from "./UIProtocol";


export abstract class UIContext{


    private m_builder:UIFrameDataBuilder;
    public constructor(){
        this.m_builder = new UIFrameDataBuilder();
    }

    protected abstract onGUI(builder:UIFrameDataBuilder);

    public update(){
        let builder= this.m_builder;
        builder.beginFrame();
        this.onGUI(builder);
        builder.endFrame();
    }
}