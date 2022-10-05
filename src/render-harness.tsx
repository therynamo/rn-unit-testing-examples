import { render as RNTLrender } from "@testing-library/react-native";
import {
  ReactNode,
  ReactElement,
  isValidElement,
  cloneElement,
  Children
} from "react";
import { Text } from "react-native";
import * as RNTL from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IntlProvider } from "react-intl";
import { Provider } from "react-redux";
import { createStore, combineReducers } from "redux";
import * as ReactNavigation from "@react-navigation/native";
import { Route } from "@react-navigation/native";
import { StackNavigationProp, StackScreenProps } from "@react-navigation/stack";
import { ParamListBase } from "@react-navigation/native";

export * from "@testing-library/react-native";

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

if (!global.jest) {
  global.jest = {
    // @ts-ignore /// TODO: Add description here
    fn: () => () => null
  };
}

export const createNavigationStackProp = <
  T extends ParamListBase,
  K extends string
>() => {
  return ({
    dispatch: jest.fn(),
    goBack: jest.fn(),
    dismiss: jest.fn(),
    navigate: jest.fn(),
    setParams: jest.fn(),
    addListener: jest.fn(),
    push: jest.fn(),
    replace: jest.fn(),
    pop: jest.fn(),
    popToTop: jest.fn(),
    isFocused: jest.fn(),
    setOptions: jest.fn()
  } as unknown) as StackNavigationProp<T, K>;
};

const mockNavigation = jest.fn(() => createNavigationStackProp());

/**
 * This object can be used in place of `props` when type errors arise due to providing
 * the managed state of the component via the `render` options.
 *
 * @example
 * import { render, stackScreenPropsStub } from "@test-utils";
 *
 * describe('some test', () => {
 *  it('should do something', () => {
 *    const {getByText} = render(<MyComponentWithStackScreenProps {...stackScreenPropsStub} />, {
 *     screenParams: {...}
 *    });
 *  });
 * });
 */
export const stackScreenPropsStub: any = {};

export const MockAppProvider = ({
  children,
  navigationProps,
  optimizelyOptions,
  themeName,
  locale = "en",
  params,
  route = {},
  state
}: {
  children: ReactNode;
  navigationProps: StackNavigationProp<ReactNavigation.ParamListBase, string>;
  optimizelyOptions?: { variation?: string; experiment?: string };
  themeName?: any;
  locale?: string;
  params?: ReactNavigation.ParamListBase;
  route?: Partial<Omit<Route<string>, "params">>;
  state?: Record<string, any>;
}) => {
  /**
   *
   * We leave this in the `MockAppProvider` so that a new store is created with every `render` call.
   * This way we avoid test pollution and unintended side effects.
   */
  const MockProvider = ({
    children,
    testStateStub
  }: {
    children: ReactNode;
    testStateStub?: Record<string, any>;
  }) => (
    <Provider store={createStore(combineReducers({}), testStateStub ?? {})}>
      {children}
    </Provider>
  );

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

  const hasParams = !!Object.values(params).length;
  const hasRoute = !!Object.values(route).length;

  if (hasParams || hasRoute) {
    (ReactNavigation.useRoute as jest.Mock).mockReturnValue({
      ...route,
      params
    });
  }

  const elements = Children.toArray(children);

  if (isValidElement(children)) {
    elements[0] = cloneElement(elements[0], {
      navigation: navigationProps,
      route: { ...route, params }
    });
  }

  return (
    <QueryClientProvider client={queryClient}>
      <MockProvider testStateStub={state}>
        <IntlProvider locale={locale} textComponent={Text}>
          {elements}
        </IntlProvider>
      </MockProvider>
    </QueryClientProvider>
  );
};

type RenderOptionsStackScreenProps<
  S extends ReactNavigation.ParamListBase = {},
  A extends keyof S = ""
> = DeepPartial<StackScreenProps<S, A>["route"]["params"]>;
interface RenderOptions<
  StackScreenParams extends ReactNavigation.ParamListBase,
  AppRoute extends keyof StackScreenParams
> extends RNTL.RenderOptions {
  reduxState?: Record<string, any>;

  route?: Partial<Omit<Route<string>, "params">>;

  screenParams?: RenderOptionsStackScreenProps<
    StackScreenParams,
    AppRoute
  > extends undefined
    ? { [k: string]: any }
    : RenderOptionsStackScreenProps<StackScreenParams, AppRoute>;
}

export function render<
  StackScreenParams extends ReactNavigation.ParamListBase = {},
  AppRoute extends keyof StackScreenParams = ""
>(
  children: ReactElement,
  options?: RenderOptions<StackScreenParams, AppRoute>
) {
  const { reduxState, screenParams, route, ...rest } = options ?? {};

  const screenProps = createNavigationStackProp();
  mockNavigation.mockReturnValue(screenProps);

  const rntlRenderConsts = RNTLrender(children, {
    wrapper: ({ children }: { children: ReactElement }) => (
      <MockAppProvider
        params={screenParams}
        state={reduxState}
        navigationProps={screenProps}
        route={route}
      >
        {children}
      </MockAppProvider>
    ),
    ...rest
  });

  return {
    ...rntlRenderConsts,
    navMock: {
      ...screenProps
    }
  };
}
