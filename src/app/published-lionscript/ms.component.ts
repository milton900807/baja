
import { AfterViewInit, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { PubComponent } from './pub-component';
import { IoniScriptManager } from '../engine/io-manager';
import { PubComponentListener } from './pub-component-listener';
declare const molstar: any;


@Component({
  selector: 'app-molstar-embed',
  templateUrl: './ms.component.html',
  styleUrls: ['./ms.component.scss'],
})
export class MolstarEmbedComponent implements AfterViewInit, PubComponent {
  listener: PubComponentListener;
  resolveFunction: any;
  title: string;
  reference: string;


  viewer: any;

  @Input() data: any = '';

  init(ionEngine: IoniScriptManager): string {

    return '';

  }
  @ViewChild('app', { static: true }) appEl!: ElementRef<HTMLDivElement>;

  async ngAfterViewInit(): Promise<void> {
    // Create the Mol* viewer with the same options as your snippet
    this.viewer = await molstar.Viewer.create(this.appEl.nativeElement, {
      layoutIsExpanded: true,
      layoutShowControls: false,
      layoutShowRemoteState: false,
      layoutShowSequence: true,
      layoutShowLog: false,
      layoutShowLeftPanel: true,

      viewportShowExpand: true,
      viewportShowSelectionMode: false,
      viewportShowAnimation: false,

      pdbProvider: 'rcsb',
      emdbProvider: 'rcsb',
    });

    // Match your loads:
    // (Type cast to any because these convenience helpers are on the bundled API;
    // the importable Viewer exposes them but TypeScript defs can lag.)
    // (viewer as any).loadEmdb('EMD-30210', { detail: 6 });

    // Examples matching your commented lines (keep commented unless you need them):
    // await (viewer as any).loadAllModelsOrAssemblyFromUrl(
    //   'https://cs.litemol.org/5ire/full',
    //   'mmcif',
    //   false,
    //   { representationParams: { theme: { globalName: 'operator-name' } } }
    // );
    if (this.data && this.data['url']) {

      let l = 'my structure'
      if (this.data['label']) {
        l = this.data['label']
      }
      this.reference = l;
      await (this.viewer as any).loadStructureFromUrl(this.data['url'], 'pdb', false, {
        representationParams: {
          theme: { globalName: 'uniform', globalColorParams: { value: 0xff0000 } }
        },
        label: this.reference
      });
    } else {
      // (viewer as any).loadPdb('7bv2');
      if (this.data && this.data['urls']) {
        let t = this.data.urls
        let l = 'my structure'
        if (this.data['labels']) {
          l = this.data['labels'][0]
        }
        this.reference = l;
        await (this.viewer as any).loadStructureFromUrl(this.data['urls'][0], 'pdb', false, {
          representationParams: {
            theme: { globalName: 'uniform', globalColorParams: { value: 0xff0000 } }
          },
          label: this.reference
        });

        for (let i = 1; i < t.length; i++) {

          this.addStructure(t[i], 'pdb', {
            label: 'structure' + i,
            superposeTo: this.reference,   // must match the label you used when loading the ref
            mode: 'sequence'
          });
        }
      }
    }
  }
  /** Add a structure to the current scene, optionally superposing it to an existing one. */
  public async addStructure(
    src: string,
    format: 'pdb' | 'mmcif' | 'cif' = 'pdb',
    opts?: {
      label?: string;
      /** label string or zero-based index of the existing structure to superpose to */
      superposeTo?: string | number;
      mode?: 'sequence' | 'coords';
      selection?: { ref?: string; mov?: string };
      /** optional representation params, same shape Mol* uses */
      representationParams?: any;
    }
  ): Promise<void> {
    if (!this.viewer?.plugin) throw new Error('Mol* viewer not ready yet.');
    const plugin = (this.viewer as any).plugin;

    // 1) Load the new (mobile) structure
    const label = opts?.label ?? `model-${Date.now()}`;
    const comp = await (this.viewer as any).loadStructureFromUrl(src, format, false, {
      label,
      representationParams: opts?.representationParams ?? {}
    });
    if (!comp) throw new Error('Failed to load structure.');

    // 2) Early exit if no superposition requested
    if (opts?.superposeTo === undefined) {
      // Optionally focus view on all
      await plugin.managers.camera.focusFit();
      return;
    }

    // 3) Resolve reference (existing) and mobile (just loaded) Structure objects
    const structs = plugin.managers.structure.hierarchy.current.structures;
    if (structs.length < 2) {
      console.warn('[Mol*] Need at least 2 structures in the scene to superpose.');
      return;
    }

    const mobile = structs.find(s => s?.cell?.obj?.label === label)?.cell?.obj?.data
      ?? structs[structs.length - 1]?.cell?.obj?.data;
    if (!mobile) throw new Error('Could not resolve newly added (mobile) Structure.');

    const reference = this._resolveExistingStructure(opts.superposeTo);
    if (!reference) throw new Error('Could not resolve reference Structure to superpose to.');

    // 4) Do the superposition (if helper exists in your bundle)
    const superpose = plugin.managers.structure.hierarchy.superposeStructures;
    if (typeof superpose !== 'function') {
      console.warn('[Mol*] superposeStructures not found in this bundle. Update Mol* or wire a manual transform.');
      return;
    }

    await superpose(mobile, reference, {
      mode: (opts?.mode === 'coords' ? 'coords' : 'sequence'),
      selection: {
        reference: opts?.selection?.ref,
        mobile: opts?.selection?.mov
      }
    });

    await plugin.managers.camera.focusFit();
  }

  /** Utility: get an existing Structure by label or index (0 = first loaded). */
  private _resolveExistingStructure(key: string | number) {
    const plugin = (this.viewer as any).plugin;
    const structs = plugin.managers.structure.hierarchy.current.structures;

    if (typeof key === 'number') {
      return structs[key]?.cell?.obj?.data ?? null;
    }
    if (typeof key === 'string') {
      const item = structs.find(s => s?.cell?.obj?.label === key);
      return item?.cell?.obj?.data ?? null;
    }
    return null;
  }


}
