import {
  ChangeDetectionStrategy, Component,
  OnInit,
  signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  filter, repeat, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TargetDetailsComponent } from 'app/pages/sharing/iscsi/target/all-targets/target-details/target-details.component';
import { TargetListComponent } from 'app/pages/sharing/iscsi/target/all-targets/target-list/target-list.component';
import { DeleteTargetDialogComponent } from 'app/pages/sharing/iscsi/target/delete-target-dialog/delete-target-dialog.component';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';
import { OldSlideInService } from 'app/services/old-slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-all-targets',
  styleUrls: ['./all-targets.component.scss'],
  templateUrl: './all-targets.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    TargetListComponent,
    MasterDetailViewComponent,
    TargetDetailsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
  ],
})
export class AllTargetsComponent implements OnInit {
  protected dataProvider: AsyncDataProvider<IscsiTarget>;
  targets = signal<IscsiTarget[] | null>(null);

  readonly requiredRoles = [
    Role.SharingIscsiTargetWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  constructor(
    private iscsiService: IscsiService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private matDialog: MatDialog,
    private slideInService: OldSlideInService,
  ) {}

  ngOnInit(): void {
    const targets$ = this.iscsiService.getTargets().pipe(
      repeat({ delay: () => this.iscsiService.listenForDataRefresh() }),
      tap((targets) => {
        this.targets.set(targets);

        const firstTarget = targets[targets.length - 1];
        if (!this.dataProvider.expandedRow && firstTarget) {
          this.dataProvider.expandedRow = firstTarget;
        }
      }),
    );

    this.dataProvider = new AsyncDataProvider(targets$);
  }

  deleteTarget(target: IscsiTarget): void {
    this.matDialog
      .open(DeleteTargetDialogComponent, { data: target, width: '600px' })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.dataProvider.load();
        this.dataProvider.expandedRow = null;
      });
  }

  editTarget(target: IscsiTarget): void {
    const slideInRef = this.slideInService.open(
      TargetFormComponent,
      { data: target, wide: true },
    );
    slideInRef.slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((response) => {
        this.dataProvider.load();
        this.dataProvider.expandedRow = response;
      });
  }
}
