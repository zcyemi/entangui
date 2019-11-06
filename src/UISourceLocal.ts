import { UIContainer } from "./UIContainer";
import { UIEventData } from "./UIProtocol";
import { UISource } from "./UISource";

export class UISourceLocal extends UISource {

    private m_container: UIContainer;
    public constructor(uicontainer: UIContainer) {
        super();
        this.m_container = uicontainer;

        window.requestAnimationFrame(this.onUpdate.bind(this))
    }

    public onUpdate(){

        let container = this.m_container;

        let actions = container.actions;
        if(actions!=null){
            container.actions = [];

            let actioncb = this.MessageActionCallback;
            if(actioncb!=null){
                actions.forEach(data=>{
                    actioncb(data);
                })
            }
        }

        if(container.isDirty){
            this.Render();
        }

        setTimeout(() => {
            window.requestAnimationFrame(this.onUpdate.bind(this));
        }, 200);
    }

    public sendUIEvent(evt: UIEventData) {
        var update = this.m_container.dispatchEvent(evt);
        if (update) {
            this.Render();
        }
    }


    public Render() {
        var framcb = this.MessageFrameCallback;
        if (framcb != null) {
            framcb(this.m_container.update());
        }
    }

}