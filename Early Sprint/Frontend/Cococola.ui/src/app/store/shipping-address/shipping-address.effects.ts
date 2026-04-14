import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { ShippingAddressService } from '../../core/services/shipping-address.service';
import * as ShippingAddressActions from './shipping-address.actions';
import { ToastService } from '../../shared/ui/toast/toast.service';
import { catchError, map, mergeMap, of, from } from 'rxjs';

@Injectable()
export class ShippingAddressEffects {
  private actions$ = inject(Actions);
  private shippingAddressService = inject(ShippingAddressService);
  private toast = inject(ToastService);

  loadAddresses$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShippingAddressActions.loadAddresses),
      mergeMap(() =>
        from(this.shippingAddressService.refreshAddresses()).pipe(
          map(() => ShippingAddressActions.loadAddressesSuccess({
            addresses: this.shippingAddressService.addresses()
          })),
          catchError(error => of(ShippingAddressActions.loadAddressesFailure({ error: error?.message ?? 'Unknown error' })))
        )
      )
    )
  );

  addAddress$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShippingAddressActions.addAddress),
      mergeMap(({ address }) =>
        from(this.shippingAddressService.addAddress(address)).pipe(
          map(() => ShippingAddressActions.addAddressSuccess()),
          catchError(error => {
            this.toast.error('Failed to add address');
            return of(ShippingAddressActions.addAddressFailure({ error: error?.message ?? 'Unknown error' }));
          })
        )
      )
    )
  );

  updateAddress$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShippingAddressActions.updateAddress),
      mergeMap(({ id, address }) =>
        from(this.shippingAddressService.updateAddress(id, address)).pipe(
          map(() => ShippingAddressActions.updateAddressSuccess()),
          catchError(error => {
            this.toast.error('Failed to update address');
            return of(ShippingAddressActions.updateAddressFailure({ error: error?.message ?? 'Unknown error' }));
          })
        )
      )
    )
  );

  deleteAddress$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShippingAddressActions.deleteAddress),
      mergeMap(({ id }) =>
        from(this.shippingAddressService.deleteAddress(id)).pipe(
          map(() => ShippingAddressActions.deleteAddressSuccess()),
          catchError(error => {
            this.toast.error('Failed to delete address');
            return of(ShippingAddressActions.deleteAddressFailure({ error: error?.message ?? 'Unknown error' }));
          })
        )
      )
    )
  );

  setDefaultAddress$ = createEffect(() =>
    this.actions$.pipe(
      ofType(ShippingAddressActions.setDefaultAddress),
      mergeMap(({ id }) =>
        from(this.shippingAddressService.setDefault(id)).pipe(
          map(() => ShippingAddressActions.setDefaultAddressSuccess()),
          catchError(error => {
            this.toast.error('Failed to set default address');
            return of(ShippingAddressActions.setDefaultAddressFailure({ error: error?.message ?? 'Unknown error' }));
          })
        )
      )
    )
  );

  // Reload addresses after any mutation success
  reloadAfterMutation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(
        ShippingAddressActions.addAddressSuccess,
        ShippingAddressActions.updateAddressSuccess,
        ShippingAddressActions.deleteAddressSuccess,
        ShippingAddressActions.setDefaultAddressSuccess
      ),
      map(() => ShippingAddressActions.loadAddresses())
    )
  );
}
