import axios from "axios";

const GITHUB_GRAPHQL_ENDPOINT = "https://api.github.com/graphql";

// 環境変数のチェック
const token = process.env.GITHUB_TOKEN;
if (!token) {
  throw new Error("GITHUB_TOKEN is not set");
}

const githubRepo = process.env.GITHUB_REPO;
if (!githubRepo) {
  throw new Error("GITHUB_REPO is not set");
}
const [owner, repo] = githubRepo.split("/");
if (!owner || !repo) {
  throw new Error("GITHUB_REPO must be in the format 'owner/repo'");
}

const discussionCategoryName =
  process.env.DISCUSSION_CATEGORY_NAME || "General";

// GraphQLクエリやミューテーションをまとめて定義
const GET_REPOSITORY_ID = `
  query($owner:String!,$repo:String!) {
    repository(owner:$owner, name:$repo) {
      id
    }
  }
`;

const GET_DISCUSSION_CATEGORIES = `
  query($owner:String!,$repo:String!) {
    repository(owner:$owner, name:$repo) {
      discussionCategories(first:25) {
        nodes {
          id
          name
        }
      }
    }
  }
`;

const CREATE_DISCUSSION = `
  mutation($repositoryId:ID!,$categoryId:ID!,$title:String!,$body:String!) {
    createDiscussion(input:{repositoryId:$repositoryId,categoryId:$categoryId,title:$title,body:$body}) {
      discussion {
        id
        title
        url
      }
    }
  }
`;

// GitHub GraphQL API呼び出し用ヘルパー
async function callGitHubGraphQL(
  query: string,
  variables: Record<string, unknown>
) {
  const res = await axios.post(
    GITHUB_GRAPHQL_ENDPOINT,
    { query, variables },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (res.data.errors) {
    const messages = res.data.errors
      .map((err: { message: string }) => err.message)
      .join("\n");
    throw new Error(`GitHub GraphQL API Error: ${messages}`);
  }

  return res.data.data;
}

// repositoryId取得関数
async function getRepositoryId(owner: string, repo: string): Promise<string> {
  const data = await callGitHubGraphQL(GET_REPOSITORY_ID, { owner, repo });
  const repositoryId = data.repository.id;
  return repositoryId;
}

// categoryId取得関数
async function getDiscussionCategoryId(
  owner: string,
  repo: string,
  categoryName: string
): Promise<string> {
  const data = await callGitHubGraphQL(GET_DISCUSSION_CATEGORIES, {
    owner,
    repo,
  });
  const categories = data.repository.discussionCategories.nodes;
  const category = categories.find(
    (cat: { name: string }) => cat.name === categoryName
  );
  if (!category) {
    throw new Error(`Category "${categoryName}" not found in this repository`);
  }
  return category.id;
}

// 実際にディスカッションを作成する関数
export async function postToDiscussion(title: string, body: string) {
  const repositoryId = await getRepositoryId(owner, repo);
  const categoryId = await getDiscussionCategoryId(
    owner,
    repo,
    discussionCategoryName
  );

  const data = await callGitHubGraphQL(CREATE_DISCUSSION, {
    repositoryId,
    categoryId,
    title,
    body,
  });

  return data.createDiscussion.discussion;
}
