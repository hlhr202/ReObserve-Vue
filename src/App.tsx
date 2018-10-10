import { Component as VueComponent } from 'vue-tsx-support';
import { Component, Prop } from 'vue-property-decorator';
import { UnaryFunction, Observable, Subscription } from 'rxjs';
import { VNode, VueConstructor, CreateElement } from 'vue';
import ReObserve, { fromAction, dispatch } from '@hlhr202/reobserve';
import { map } from 'rxjs/operators';

declare module 'rxjs/internal/Observable' {
    interface Observable<T> {
        pipe<A, E>(operator: (source: Observable<T>) => VNode): VueConstructor<any>;
    }
}

const toRender: <T, A>(
    render: (h: CreateElement, data: T, props: A) => VNode,
) => UnaryFunction<Observable<T>, VNode> = renderFunction => source => {
    @Component
    class WrappedComponent extends VueComponent<{ data?: any }> {
        private subscription!: Subscription;
        private data: any = null;

        @Prop({ default: null })
        private props!: any;
        mounted() {
            this.subscription = source.subscribe(data => (this.data = data));
        }
        beforeDestroy() {
            this.subscription.unsubscribe();
        }
        render(h: CreateElement) {
            return this.data ? renderFunction(h, this.data, this.props as any) : null;
        }
    }
    return WrappedComponent as any;
};

interface INumbers {
    numbers: Array<number>;
}

const number$ = new ReObserve<INumbers>({ numbers: [0, 1, 2, 3] })
    .mergeReduce(fromAction('INCREMENT').pipe<number[]>(map(action => action.payload)), (curr, payload) => ({
        numbers: curr.numbers.map((n, i) => n + payload[i]),
    }))
    .mergeReduce(fromAction('DECREMENT').pipe<number[]>(map(action => action.payload)), (curr, payload) => ({
        numbers: curr.numbers.map((n, i) => n - payload[i]),
    }));

const App = number$.asObservable().pipe<{ testProps: string }, {}>(
    toRender((h, state, props) => (
        <div>
            <button onClick={() => dispatch({ type: 'DECREMENT', payload: [1, 2, 3, 4] })}>-</button>
            {state.numbers.map((n, i) => (
                <span key={i}> {n} </span>
            ))}
            <button onClick={() => dispatch({ type: 'INCREMENT', payload: [1, 2, 3, 4] })}>+</button>
        </div>
    )),
);

export default App;
