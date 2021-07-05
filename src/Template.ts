import {Comment, CommentsRepo} from "./Comment/Comment";
import {Node, NodePayload, Root, Tree} from "./Tree";
import {DummyArticle} from "./Comment/DummyComment";

export class TemplateComment {
    constructor(public readonly comment: Comment, protected readonly children: TemplateComment[]) {}

    protected grow(node: Node, level: number): void {
        this.children.forEach((child, index) => {
            node.add(new NodePayload(child.comment, level + 1))
            child.grow(node.children[index], level + 1)
        })
    }

    protected walk(fn: (node: TemplateComment) => void): void {
        fn(this)
        this.children.forEach(child => { child.walk(fn) })
    }
}

export class TemplateRoot extends TemplateComment {
    constructor(private title: string, children: TemplateComment[]) {
        super(new DummyArticle(title), children); // TODO: normal article
    }

    asTree(): Tree {
        const root = new Root(new NodePayload(this.comment, 0), .5)
        this.grow(root, 0)
        return new Tree(root)
    }

    asComments(): CommentsRepo {
        const comments: Comment[] = []
        this.walk((node: TemplateComment) => {
            comments.push(node.comment)
        })
        return new CommentsRepo(comments)
    }
}
