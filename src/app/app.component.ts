import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, signal, computed, effect, inject } from '@angular/core';
import { computeWinningIndex } from './roulette-utils';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../environments/environment';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged, User } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  Timestamp 
} from 'firebase/firestore';

// --- Firebase Initialization ---
const app = initializeApp(environment.firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = '1:981767991649:web:98a484c14a4eea36e25520';

// --- Interfaces ---
interface Lead {
  id?: string;
  name: string;
  handle: string;
  prizeWon: string;
  createdAt: any;
}

interface Prize {
  label: string;
  color: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule],
})

export class AppComponent implements OnInit, OnDestroy {
  // --- State (Signals) ---
  user = signal<User | null>(null);
  loading = signal(true);
  view = signal<'register' | 'game' | 'result' | 'admin'>('register');
  
  // Form
  name = signal('');
  handle = signal('');
  firstName = computed(() => this.name().split(' ')[0]);

  // Game
  isSpinning = signal(false);
  rotation = signal(0);
  wonPrize = signal<string | null>(null);

  // Admin
  leads = signal<Lead[]>([]);
  selectedWinner = signal<Lead | null>(null);

  // Unsubscribe handlers for firebase listeners
  private unsubscribeAuth?: () => void;
  private unsubscribeSnapshot?: () => void;

  // Controls for label positioning (percent values)
  // Ajustes por defecto: label width control kept; offset is computed via pixels
  labelWidthPercent = signal(45);

  // Debug visual toggles (removed) - kept no-op for clarity

  // Computed pixel translate for labels (measured after view init)
  labelTranslatePx = signal(40);

  @ViewChild('wheelRef', { static: false }) private wheelRef!: ElementRef<HTMLDivElement>;
  @ViewChild('centerRef', { static: false }) private centerRef!: ElementRef<HTMLDivElement>;

  ngAfterViewInit(): void {
    // Delay to allow styles/layout to settle
    setTimeout(() => {
      try {
        const wheelEl = this.wheelRef?.nativeElement;
        const centerEl = this.centerRef?.nativeElement;
        if (wheelEl && centerEl) {
          const wheelRect = wheelEl.getBoundingClientRect();
          const centerRect = centerEl.getBoundingClientRect();

          // desired translate: center radius + small gap
          const goRadius = Math.max(centerRect.width, centerRect.height) / 2;
          const gap = 6; // px gap between GO and label start
          const desiredPx = goRadius + gap;

          // set computed translate
          this.labelTranslatePx.set(desiredPx);
        }
      } catch (e) {
        // ignore measurement errors
      }
    }, 40);
  }

  // Transition control for wheel animation (ms)
  transitionDurationMs = signal(3000);
  // (pointer animations removed; wheel will perform final smooth snap)

  // Methods to adjust label positioning interactively
  adjustLabelOffset(delta: number) {
    // function removed from UI, keep noop to avoid runtime calls
    return;
  }

  adjustLabelWidth(delta: number) {
    const next = Math.max(20, Math.min(60, this.labelWidthPercent() + delta));
    this.labelWidthPercent.set(next);
  }

  // Config
  prizes: Prize[] = [
    { label: 'Descuento 10%', color: '#EF4444' },
    { label: 'Ebook Gratis', color: '#3B82F6' },
    { label: 'Voucher $500', color: '#10B981' },
    { label: 'Consultoría', color: '#F59E0B' },
    { label: 'Intenta de nuevo', color: '#6B7280' },
    { label: 'Sorpresa', color: '#8B5CF6' },
  ];

  // Helper for gradient
  get conicGradient() {
    return `conic-gradient(
        ${this.prizes[0].color} 0deg 60deg, 
        ${this.prizes[1].color} 60deg 120deg, 
        ${this.prizes[2].color} 120deg 180deg, 
        ${this.prizes[3].color} 180deg 240deg, 
        ${this.prizes[4].color} 240deg 300deg, 
        ${this.prizes[5].color} 300deg 360deg
    )`;
  }

  // angle per segment (usable in template)
  get segmentAngle() {
    return 360 / this.prizes.length;
  }

  ngOnInit() {
    this.initAuth();
  }

  async initAuth() {
    try {
      // En local, eliminamos la verificación de __initial_auth_token
      // y usamos directamente autenticación anónima.
      await signInAnonymously(auth);
    } catch (error) {
      // Friendly handling when anonymous sign-in is disallowed by the
      // Firebase project (common in locked production projects).
      console.error("Auth error:", error);
      try {
        const errAny = error as any;
        const code = errAny?.code || errAny?.message || '';
        if (String(code).includes('admin-restricted-operation') || String(code).includes('ADMIN_RESTRICTED_OPERATION')) {
          console.warn('Anonymous authentication appears to be disabled for this Firebase project.\n' +
            'Enable Anonymous sign-in in Firebase Console -> Authentication -> Sign-in method,\n' +
            'or provide a valid auth method for this environment.');
        }
      } catch (e) {
        // ignore
      }
    }

    this.unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      this.user.set(currentUser);
      this.loading.set(false);
      
      if (currentUser) {
        this.setupFirestoreListener();
      }
    });
  }

  setupFirestoreListener() {
    const leadsRef = collection(db, 'artifacts', appId, 'public', 'data', 'game_leads');
    // Standard query without complex filters to avoid index issues
    const q = query(leadsRef);

    // remove any previous snapshot listener before attaching a new one
    if (this.unsubscribeSnapshot) this.unsubscribeSnapshot();

    this.unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
      const fetchedLeads: Lead[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Lead));
      
      // Sort client-side
      fetchedLeads.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      this.leads.set(fetchedLeads);
    }, (err) => console.error("Firestore Error:", err));
  }

  ngOnDestroy(): void {
    if (this.unsubscribeSnapshot) {
      try { this.unsubscribeSnapshot(); } catch (e) { /* ignore */ }
      this.unsubscribeSnapshot = undefined;
    }
    if (this.unsubscribeAuth) {
      try { this.unsubscribeAuth(); } catch (e) { /* ignore */ }
      this.unsubscribeAuth = undefined;
    }
  }

  setView(v: 'register' | 'game' | 'result' | 'admin') {
    this.view.set(v);
  }

  handleRegister(e: Event) {
    e.preventDefault();
    if (this.name() && this.handle()) {
      this.setView('game');
    }
  }

  spinWheel() {
    if (this.isSpinning()) return;
    this.isSpinning.set(true);

    const spins = 5;
    const degrees = Math.floor(Math.random() * 360);
    const totalRotationBase = (spins * 360) + degrees;

    // Use a deterministic, testable helper to pick the winning index
    const { index: closestIndex, centers, targetAngle, baseModulo } = computeWinningIndex(totalRotationBase, this.prizes.length, 270);

    const mainMs = 3000;
    const snapMs = 300; // you can tweak (200-400)
    const chosenCenter = centers[closestIndex];

    // compute current angle of chosenCenter after the base rotation
    const currentCenterAngleAfter = (chosenCenter + (totalRotationBase % 360) + 360) % 360;
    const pointerOffset = 270;

    // signed minimal correction in range [-180, 180]
    const signedRaw = (((pointerOffset - currentCenterAngleAfter + 540) % 360) - 180);
    const correctionSigned = Math.abs(signedRaw) < 0.5 ? 0 : signedRaw;

    // Apply correction as part of the main animation to avoid a visible snap.
    // finalRotation may be slightly less than totalRotationBase (backwards small move)
    // or slightly greater; the animation will be a single smooth transition.
    const finalRotation = totalRotationBase + correctionSigned;

    this.transitionDurationMs.set(mainMs);
    this.rotation.set(finalRotation);

    // After the main (single) animation finishes, finalize winner and persist
    setTimeout(async () => {
      const index = closestIndex;
      const result = this.prizes[index % this.prizes.length].label;

      this.wonPrize.set(result);
      this.isSpinning.set(false);

      if (this.user()) {
        try {
          const leadsRef = collection(db, 'artifacts', appId, 'public', 'data', 'game_leads');
          await addDoc(leadsRef, {
            name: this.name(),
            handle: this.handle(),
            prizeWon: result,
            createdAt: Timestamp.now()
          });
        } catch (e) {
          console.error("Error saving lead:", e);
        }
      }

      //console.log(`Winner: ${result} (closestIndex: ${index}, degrees: ${degrees}, totalRotationBase: ${totalRotationBase}, baseModulo: ${baseModulo}, targetAngle: ${targetAngle}, chosenCenter: ${chosenCenter}, correctionSigned: ${correctionSigned}, finalRotation: ${finalRotation})`);

      setTimeout(() => this.setView('result'), 1200 + 1500);
    }, mainMs);
  }

  reset() {
    this.name.set('');
    this.handle.set('');
    this.rotation.set(0);
    this.setView('register');
  }

  pickRandomWinner() {
    const currentLeads = this.leads();
    if (currentLeads.length === 0) return;
    const randomIndex = Math.floor(Math.random() * currentLeads.length);
    this.selectedWinner.set(currentLeads[randomIndex]);
  }
}