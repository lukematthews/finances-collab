import { BudgetAccessService } from '@/budget/budget-access.service';
import { BaseEntityService, WsEvent } from '@/common/base-entity.service';
import { Types } from '@/Constants';
import { WsEventBusService } from '@/events/ws-event-bus.service';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { instanceToPlain, plainToInstance } from 'class-transformer';
import { Repository } from 'typeorm';
import { Month } from '../month/month.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionDto } from './dto/transaction.dto.';
import { Transaction } from './transaction.entity';

@Injectable()
export class TransactionService extends BaseEntityService<
  Transaction,
  TransactionDto
> {
  private readonly logger = new Logger(TransactionService.name);
  private readonly budgetAccessService: BudgetAccessService;

  constructor(
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    @InjectRepository(Month)
    private monthRepo: Repository<Month>,
    eventEmitter: EventEmitter2,
    bus: WsEventBusService,
    budgetAccessService: BudgetAccessService,
  ) {
    super(transactionRepo, eventEmitter, 'transaction', bus, TransactionDto);
    this.budgetAccessService = budgetAccessService;
  }

  onModuleInit() {
    this.bus.subscribe('transaction', this.handleTransactionMessage.bind(this));
  }

  override getDefaultRelations() {
    return { month: true };
  }

  protected denormalizeDto(
    dto: TransactionDto,
    entity: Transaction,
  ): TransactionDto {
    dto.monthId = String(entity.month?.id);
    return dto;
  }

  handleTransactionMessage(message: WsEvent<TransactionDto>, userId: string) {
    (async (message: WsEvent<TransactionDto>) => {
      this.logger.log('handled transaction message in TransactionService');
      const transaction = plainToInstance(Transaction, message.payload);

      if (
        message.operation === Types.UPDATE ||
        message.operation === Types.DELETE
      ) {
        await this.budgetAccessService.assertHasRole(
          userId,
          { transactionId: transaction.id },
          ['OWNER', 'EDITOR'],
        );
      } else if (message.operation === Types.CREATE) {
        await this.budgetAccessService.assertHasRole(
          userId,
          { monthId: Number(message.payload.monthId) },
          ['OWNER', 'EDITOR'],
        );
      }
      if (message.operation === Types.CREATE) {
        await this.create('api', {
          description: message.payload.description,
          amount: message.payload.amount,
          date: message.payload.date,
          paid: message.payload.paid,
          month: { id: Number(message.payload.monthId) },
        });
      } else if (message.operation === Types.UPDATE) {
        await this.update(
          'api',
          Number(message.payload.id),
          instanceToPlain({
            description: message.payload.description,
            amount: message.payload.amount,
            date: message.payload.date,
            paid: message.payload.paid,
          }),
        );
      } else if (message.operation === Types.DELETE) {
        this.delete(userId, 'api', Number(message.payload.id));
      }
    })(message);
  }

  async createTransactions(
    budgetId: number,
    userId: string,
    transactions: CreateTransactionDto[],
  ) {
    const transactionDtos: TransactionDto[] = [];
    const unmatchedTransactions: CreateTransactionDto[] = [];

    await this.budgetAccessService.assertHasRole(
      userId,
      { budgetId: budgetId },
      ['OWNER', 'EDITOR'],
    );

    // Load months only for the specified budget
    const allMonths = await this.monthRepo.find({
      where: { budget: { id: budgetId } },
    });

    for (const t of transactions) {
      const txDate = new Date(t.date);

      const month = allMonths.find((m) => {
        const from = new Date(m.fromDate);
        const to = new Date(m.toDate);
        return txDate >= from && txDate <= to;
      });

      if (!month) {
        unmatchedTransactions.push(t);
        continue;
      }

      const newTransaction = await this.transactionRepo.save({
        description: t.description,
        amount: t.amount,
        date: t.date,
        paid: t.paid,
        month,
      });

      transactionDtos.push(plainToInstance(TransactionDto, newTransaction));
    }

    return {
      created: transactionDtos.length,
      unmatched: {
        count: unmatchedTransactions.length,
        transactions: unmatchedTransactions,
      },
    };
  }

  async addTransaction(month: Month, transaction: CreateTransactionDto) {
    const created = await this.transactionRepo.save({
      amount: transaction.amount,
      date: transaction.date,
      description: transaction.description,
      paid: transaction.paid,
      month: month,
    });
    return created;
  }
}
