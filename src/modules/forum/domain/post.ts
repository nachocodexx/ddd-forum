
import { AggregateRoot } from "../../../shared/domain/AggregateRoot";
import { UniqueEntityID } from "../../../shared/domain/UniqueEntityID";
import { Result } from "../../../shared/core/Result";
import { MemberId } from "./memberId";
import { PostSlug } from "./postSlug";
import { PostTitle } from "./postTitle";
import { PostId } from "./postId";
import { PostText } from "./postText";
import { Comment } from "./comment";
import { Guard, IGuardArgument } from "../../../shared/core/Guard";
import { has } from 'lodash'
import { PostCreated } from "./events/postCreated";
import { PostType } from "./postType";
import { PostLink } from "./postLink";

interface PostProps {
  memberId: MemberId;
  slug: PostSlug;
  title: PostTitle;
  type: PostType;
  text?: PostText;
  link?: PostLink;
  comments?: Comment[];
  points?: number; // posts can have negative or positive valued points
  dateTimePosted?: string | Date;
}

export class Post extends AggregateRoot<PostProps> {

  get postId (): PostId {
    return PostId.create(this._id)
    .getValue();
  }

  get memberId (): MemberId {
    return this.props.memberId;
  }

  get title (): PostTitle {
    return this.props.title;
  }

  get slug (): PostSlug {
    return this.props.slug;
  }

  get dateTimePosted (): string | Date {
    return this.props.dateTimePosted;
  }

  get comments (): Comment[] {
    return this.props.comments;
  }

  get points (): number {
    return this.props.points;
  }

  get link (): PostLink {
    return this.props.link;
  }

  get type (): PostType {
    return this.props.type;
  }

  public isLinkPost (): boolean {
    return this.props.type === 'link';
  }

  public isTextPost (): boolean {
    return this.props.type === 'text';
  }

  private constructor (props: PostProps, id?: UniqueEntityID) {
    super(props, id);
  }

  public static isValidPostType (rawType: string): boolean {
    const linkType: PostType = 'link';
    const textType: PostType = 'text';
    return rawType === textType || rawType === linkType;
  }

  public static create (props: PostProps, id?: UniqueEntityID): Result<Post> {
    const guardArgs: IGuardArgument[] = [
      { argument: props.memberId, argumentName: 'memberId' },
      { argument: props.slug, argumentName: 'slug' },
      { argument: props.title, argumentName: 'title' },
      { argument: props.type, argumentName: 'type' }
    ];

    if (props.type === 'link') {
      guardArgs.push({ argument: props.link, argumentName: 'link' })
    } else {
      guardArgs.push({ argument: props.text, argumentName: 'text' })
    }

    const guardResult = Guard.againstNullOrUndefinedBulk(guardArgs);

    if (!guardResult.succeeded) {
      return Result.fail<Post>(guardResult.message);
    }

    if (!this.isValidPostType(props.type)) {
      return Result.fail<Post>("Invalid post type provided.")
    }

    const defaultValues: PostProps = {
      ...props,
      comments: props.comments ? props.comments : [],
      points: has(props, 'points') ? props.points : 1,
      dateTimePosted: props.dateTimePosted ? props.dateTimePosted : new Date()
    };

    const isNewPost = !!id === false;
    const post = new Post(defaultValues, id);

    if (isNewPost) {
      post.addDomainEvent(new PostCreated(post));
    }

    return Result.ok<Post>(post);
  }
}