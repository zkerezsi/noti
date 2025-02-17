import { isPlatformServer } from '@angular/common';
import { Component, Inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'noti';
  loading = signal(true);
  #platformId: Object;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.#platformId = platformId;
  }

  ngOnInit(): void {
    // TODO: check if user data is installed
    if (isPlatformServer(this.#platformId)) {
      return;
    }

    console.log(localStorage.getItem('hello'));
    setTimeout(() => this.loading.set(false), 1000);
  }
}
