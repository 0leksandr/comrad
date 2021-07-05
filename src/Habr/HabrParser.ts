import {TemplateComment, TemplateRoot} from "../Template";
import {HabrComment} from "./HabrComment";

export class HabrParser {
    parseElement(title: string, html: HTMLElement): TemplateRoot {
        return new TemplateRoot(
            title,
            this.parseMany(HabrParser.select(html, "ul#comments-list"))
        )
    }

    parseUrl(title: string, path: string): Promise<TemplateRoot> {
        return new Promise<TemplateRoot>(resolve => {
            fetch(path)
                .then(response => response.text())
                .then(html => {
                    const element = document.createElement('html')
                    element.innerHTML = html
                    resolve(this.parseElement(title, element))
                })
        })
    }

    private static select(element: Element, query: string): Element {
        const selected = element.querySelector(query)
        if (!selected) throw new Error("Йобаний врот, Cannot query select")
        return selected
    }

    private parseMany(comments: Element): TemplateComment[] {
        const parsedComments: TemplateComment[] = []
        comments.querySelectorAll(":scope > li.content-list__item_comment").forEach(comment => {
            parsedComments.push(this.parseOne(comment))
        })
        return parsedComments
    }

    private parseOne(comment: Element): TemplateComment {
        return new TemplateComment(
            new HabrComment(HabrParser.select(comment, ":scope > .comment")),
            this.parseMany(HabrParser.select(comment, ":scope > ul.content-list"))
        )
    }
}
