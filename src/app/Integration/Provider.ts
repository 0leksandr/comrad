import {TemplateRoot} from "../Template";

export interface Provider {
    get(): Promise<TemplateRoot>
}
