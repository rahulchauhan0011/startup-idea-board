import { i } from "@instantdb/react";

const _schema = i.schema({
  entities: {
    ideas: i.entity({
      title: i.string(),
      description: i.string(),
      category: i.string().indexed(),
      createdAt: i.number().indexed(),
      authorId: i.string().indexed(),
    }),
    votes: i.entity({
      ideaId: i.string().indexed(),
      userId: i.string().indexed(),
      key: i.string().unique().indexed(),
      createdAt: i.number(),
    }),
    comments: i.entity({
      ideaId: i.string().indexed(),
      userId: i.string().indexed(),
      text: i.string(),
      createdAt: i.number().indexed(),
    }),
  },
});

type _AppSchema = typeof _schema;
type AppSchema = _AppSchema;
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;

