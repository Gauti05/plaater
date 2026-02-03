import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-crm-view',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './crm-view.component.html',
  styleUrls: ['./crm-view.component.css']
})
export class CrmViewComponent {
  @Input() customers: any[] = [];
}