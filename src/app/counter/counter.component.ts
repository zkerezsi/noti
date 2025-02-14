import { Component, OnInit, signal } from '@angular/core';
import { Apollo, gql } from 'apollo-angular';

@Component({
  selector: 'app-counter',
  imports: [],
  templateUrl: './counter.component.html',
  styleUrl: './counter.component.css',
})
export class CounterComponent implements OnInit {
  #apollo: Apollo;

  count = signal(0);
  message = signal('');

  constructor(apollo: Apollo) {
    this.#apollo = apollo;
  }

  ngOnInit() {
    this.#apollo
      .query({
        query: gql`
          query ExampleQuery {
            hello
          }
        `,
      })
      .subscribe(({ data }) => this.message.set(JSON.stringify(data)));
  }

  inc() {
    this.count.set(this.count() + 1);
  }
}
