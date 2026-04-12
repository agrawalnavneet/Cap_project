import { Component, Input } from '@angular/core';

@Component({
  selector: 'ccb2b-card',
  standalone: false,
  template: `
    <div class="ccb2b-card" [ngClass]="getClasses()" [class.ccb2b-card--clickable]="clickable"
         [class.ccb2b-card--selected]="selected" [class.ccb2b-card--hover]="hover"
         [tabindex]="clickable ? 0 : -1">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .ccb2b-card {
      background: var(--bg-card);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-card);
      transition: transform var(--duration-base) var(--ease-out),
                  box-shadow var(--duration-base) var(--ease-out),
                  border-color var(--duration-base) var(--ease-out);
      border: 1px solid transparent;
    }

    .ccb2b-card--padding-sm { padding: 12px; }
    .ccb2b-card--padding-md { padding: 20px; }
    .ccb2b-card--padding-lg { padding: 28px; }

    .ccb2b-card--shadow-none { box-shadow: none; }
    .ccb2b-card--shadow-sm { box-shadow: var(--shadow-sm); }
    .ccb2b-card--shadow-md { box-shadow: var(--shadow-md); }
    .ccb2b-card--shadow-lg { box-shadow: var(--shadow-lg); }

    .ccb2b-card--hover:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .ccb2b-card--clickable {
      cursor: pointer;
    }

    .ccb2b-card--clickable:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-lg);
    }

    .ccb2b-card--selected {
      border-color: var(--hul-primary);
      background: var(--hul-primary-light);
    }

    .ccb2b-card:focus-visible {
      outline: 2px solid var(--border-focus);
      outline-offset: 2px;
    }
  `]
})
export class CcbCardComponent {
  @Input() padding: 'sm' | 'md' | 'lg' = 'md';
  @Input() shadow: 'none' | 'sm' | 'md' | 'lg' = 'sm';
  @Input() hover = false;
  @Input() clickable = false;
  @Input() selected = false;

  getClasses(): string {
    return `ccb2b-card--padding-${this.padding} ccb2b-card--shadow-${this.shadow}`;
  }
}
