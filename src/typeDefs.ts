import { gql } from 'apollo-angular';

export default gql`
  type Query {
    hello: String
    world: String
  }
`;
