import {
  ExistingProvider, FactoryProvider, forwardRef, ValueProvider,
} from '@angular/core';
import { createSpyObject } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { DeepPartial } from 'utility-types';
import { MockAuthService } from 'app/core/testing/classes/mock-auth.service';
import { AccountAttribute } from 'app/enums/account-attribute.enum';
import { Role } from 'app/enums/role.enum';
import { LoggedInUser } from 'app/interfaces/ds-cache.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { TokenLastUsedService } from 'app/services/token-last-used.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';

export const dummyUser = {
  privilege: {
    roles: {
      $set: [Role.FullAdmin],
    },
    web_shell: true,
  },
  account_attributes: [AccountAttribute.Local, AccountAttribute.SysAdmin],
  pw_name: 'root',
  attributes: {} as LoggedInUser['attributes'],
  two_factor_config: {} as LoggedInUser['two_factor_config'],
  pw_uid: 0,
} as LoggedInUser;

/**
 * Provides a dummy user with full admin privileges.
 * To set custom roles, inject `MockAuthService` and call `setRoles`.
 */
export function mockAuth(
  user: DeepPartial<LoggedInUser> = dummyUser,
): (FactoryProvider | ExistingProvider | ValueProvider)[] {
  return [
    {
      provide: AuthService,
      useFactory: () => {
        const mockService = new MockAuthService(
          createSpyObject(Store),
          createSpyObject(ApiService),
          createSpyObject(TokenLastUsedService),
          createSpyObject(Window),
          createSpyObject(WebSocketStatusService, {
            isConnected$: of(true),
            isAuthenticated$: of(false),
          }),
        );

        mockService.setUser(user as LoggedInUser);
        return mockService;
      },
    },
    {
      provide: MockAuthService,
      useExisting: forwardRef(() => AuthService),
    },
  ];
}
