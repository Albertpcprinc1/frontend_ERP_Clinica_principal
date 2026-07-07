import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-intranet-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './intranet-layout.html',
  styleUrl: './intranet-layout.scss'
})
export class IntranetLayoutComponent {
}