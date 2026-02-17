import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface Ticket {
  id: string;
  store: string;
  subject: string;
  category: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Open' | 'In Progress' | 'Resolved';
  date: string;
  messages: { sender: string; text: string; time: string; isAdmin: boolean }[];
}

@Component({
  selector: 'app-support-tickets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './support-tickets.component.html',
  styleUrls: ['./support-tickets.component.css']
})
export class SupportTicketsComponent {
  
  public searchText: string = '';
  public statusFilter: string = 'All';
  public replyText: string = '';
  public selectedTicket: Ticket | null = null;

  // Mock Data
  public tickets: Ticket[] = [
    { id: 'TKT-8902', store: 'Downtown Cafe', subject: 'Printer not connecting to POS', category: 'Hardware', priority: 'High', status: 'Open', date: 'Oct 24, 10:30 AM', messages: [{ sender: 'John (Manager)', text: 'Our thermal printer stopped responding after the update.', time: '10:30 AM', isAdmin: false }] },
    { id: 'TKT-8901', store: 'Burger Joint NYC', subject: 'Billing Discrepancy in Invoice #992', category: 'Billing', priority: 'Medium', status: 'In Progress', date: 'Oct 23, 04:15 PM', messages: [{ sender: 'Sarah (Owner)', text: 'I was charged for the Pro plan but I am on Starter.', time: '04:15 PM', isAdmin: false }, { sender: 'Support Team', text: 'Checking your transaction history now.', time: '04:30 PM', isAdmin: true }] },
    { id: 'TKT-8890', store: 'Pizza Palace', subject: 'Feature Request: Half/Half Pizza', category: 'Feature', priority: 'Low', status: 'Resolved', date: 'Oct 20, 09:00 AM', messages: [{ sender: 'Mike', text: 'Can we add half toppings?', time: '09:00 AM', isAdmin: false }] },
    { id: 'TKT-8905', store: 'Sushi World', subject: 'Unable to login to dashboard', category: 'Access', priority: 'High', status: 'Open', date: 'Oct 24, 11:45 AM', messages: [{ sender: 'Kenji', text: 'Password reset email is not arriving.', time: '11:45 AM', isAdmin: false }] }
  ];

  get filteredTickets() {
    return this.tickets.filter(t => {
      const matchesSearch = t.store.toLowerCase().includes(this.searchText.toLowerCase()) || t.subject.toLowerCase().includes(this.searchText.toLowerCase());
      const matchesStatus = this.statusFilter === 'All' || t.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  openTicket(ticket: Ticket) {
    this.selectedTicket = ticket;
    this.replyText = '';
  }

  closeTicket() {
    this.selectedTicket = null;
  }

  sendReply() {
    if (!this.replyText.trim() || !this.selectedTicket) return;
    
    this.selectedTicket.messages.push({
      sender: 'Super Admin',
      text: this.replyText,
      time: 'Just now',
      isAdmin: true
    });
    
    this.replyText = '';
  }
}