import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Component({
    selector: 'pdb-viewer',
    templateUrl: './viewer.component.html',
    styleUrls: ['./viewer.component.css']
})
export class PDBViewerComponent implements OnInit {
    @ViewChild('pdb') private canvasRef: ElementRef;

    private get canvas(): HTMLCanvasElement {
        return this.canvasRef.nativeElement;
    }

    private renderer: THREE.WebGLRenderer;
    private camera: THREE.PerspectiveCamera;
    private scene: THREE.Scene;
    private controls: OrbitControls;

    constructor() { }

    ngOnInit(): void {
        this.initThree();
        this.loadMolecule();
        this.animate();
    }

    private initThree(): void {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.camera.position.z = 5;
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    }


    private waterMolecule = {
        atoms: [
            { id: 1, type: 'O', x: 0.000, y: 0.000, z: 0.000 },
            { id: 2, type: 'H', x: 0.958, y: 0.000, z: 0.000 },
            { id: 3, type: 'H', x: -0.239, y: 0.927, z: 0.000 }
        ],
        bonds: [
            { start: 1, end: 2 },
            { start: 1, end: 3 }
        ]
    };

    private loadMolecule(): void {
        const atomGeometry = new THREE.SphereGeometry(0.1, 32, 32);
        const atomMaterialO = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red for Oxygen
        const atomMaterialH = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // Green for Hydrogen

        this.waterMolecule.atoms.forEach(atom => {
            const material = atom.type === 'O' ? atomMaterialO : atomMaterialH;
            const sphere = new THREE.Mesh(atomGeometry, material);
            sphere.position.set(atom.x, atom.y, atom.z);
            this.scene.add(sphere);
        });

        // Add bonds here (as cylinders for example) if needed
    }

    private animate(): void {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}
