import ExampleStore from './ExampleStore'
import TopicStore from './TopicStore'
import PostStore from './PostStore'

class RootStore {
  exampleStore: ExampleStore
  topicStore: TopicStore
  postStore: PostStore

  constructor() {
    this.exampleStore = new ExampleStore()
    this.topicStore = new TopicStore()
    this.postStore = new PostStore()
  }
}

export default RootStore

