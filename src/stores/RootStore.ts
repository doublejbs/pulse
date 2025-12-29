import ExampleStore from './ExampleStore'
import TopicStore from './TopicStore'
import PostStore from './PostStore'
import SearchStore from './SearchStore'

class RootStore {
  exampleStore: ExampleStore
  topicStore: TopicStore
  postStore: PostStore
  searchStore: SearchStore

  constructor() {
    this.exampleStore = new ExampleStore()
    this.topicStore = new TopicStore()
    this.postStore = new PostStore()
    this.searchStore = new SearchStore()
  }
}

export default RootStore

